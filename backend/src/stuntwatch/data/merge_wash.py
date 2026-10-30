import re

import pandas as pd

from ..utils.config import DATA_PROC, MERGED_V1, MERGED_V2, WASH_LONG

COLS = {
    "air_minum_layak": "air_minum_layak_kab",
    "sanitasi_layak": "sanitasi_layak_kab",
    "rls": "rls_kab",
    "hls": "hls_kab",
    "uhh": "uhh_kab",
    "pengeluaran": "pengeluaran_kab",
}
TITLE_OK = {
    "rls": lambda title: "indeks" not in title.lower(),
    "hls": lambda title: "indeks" not in title.lower(),
    "uhh": lambda title: "indeks" not in title.lower(),
    "pengeluaran": lambda title: "disesuaikan" in title.lower(),
}
TOTAL_RE = re.compile(r"total|jumlah|perkotaan\s*\+|kota\s*\+|^\s*$", re.I)
YEARS = ("2024", "2023")


def _norm(value: object) -> str:
    name = str(value).lower()
    name = re.sub(r"\b(kabupaten|kab|kota|adm)\b\.?", "", name)
    return re.sub(r"[^a-z]", "", name)


def run() -> pd.DataFrame:
    merged = pd.read_csv(MERGED_V1)
    if "domain_id" not in merged.columns:
        raise ValueError(
            f"No 'domain_id' column in {MERGED_V1}; "
            f"available columns: {list(merged.columns)}"
        )
    merged["domain_id"] = pd.to_numeric(
        merged["domain_id"], errors="coerce"
    ).astype("Int64")
    valid_rows = merged.dropna(subset=["domain_id"])
    district_ids = valid_rows["domain_id"].astype(int)
    valid = set(district_ids)
    district_counts = district_ids.groupby((district_ids // 100) * 100).size().to_dict()

    wash = pd.read_csv(WASH_LONG, dtype={"domain": str})
    wash["kode_i"] = pd.to_numeric(wash["kode"], errors="coerce")
    wash["dom_i"] = pd.to_numeric(wash["domain"], errors="coerce")
    name_col = (
        "kabupaten_kota_bps"
        if "kabupaten_kota_bps" in merged.columns
        else "kabupaten_kota_st"
    )
    name_lookup = {}
    for domain_id, name in zip(district_ids, valid_rows[name_col]):
        name_lookup.setdefault((domain_id // 100 * 100, _norm(name)), domain_id)

    wash["kode_i"] = wash["kode_i"].astype("float64")
    invalid_codes = ~wash["kode_i"].isin(valid)
    recovered = [
        name_lookup.get((int(domain), _norm(label)), float("nan"))
        if pd.notna(domain)
        else float("nan")
        for domain, label in zip(
            wash.loc[invalid_codes, "dom_i"],
            wash.loc[invalid_codes, "label"],
        )
    ]
    wash.loc[invalid_codes, "kode_i"] = recovered
    recovered_count = int(
        invalid_codes.sum() - wash.loc[invalid_codes, "kode_i"].isna().sum()
    )
    print(
        "recovered by name:",
        recovered_count,
        "of",
        int(invalid_codes.sum()),
    )
    wash["value_f"] = pd.to_numeric(
        wash["value"].astype(str).str.replace(",", ".", regex=False),
        errors="coerce",
    )
    wash["year"] = wash["year"].astype(str).str.extract(r"(\d{4})")[0]
    wash["turvar"] = wash["turvar"].fillna("").astype(str)

    recent = wash[wash["year"].isin(YEARS) & wash["value_f"].notna()]
    coverage = recent["kode_i"].isin(valid).mean() if len(recent) else 0
    print(
        f"rows with 2023/2024 values: {len(recent)}; "
        f"kode found in merged domain_id: {coverage:.0%}"
    )
    wash = wash[wash["kode_i"].isin(valid) & wash["value_f"].notna()].copy()
    wash["kode_i"] = wash["kode_i"].astype(int)

    picked = {concept: {} for concept in COLS}
    picked_year = {concept: {} for concept in COLS}
    ambiguous_total = 0
    for (domain, concept), group in wash.groupby(["dom_i", "concept"]):
        if concept not in COLS:
            continue
        title_filter = TITLE_OK.get(concept)
        if title_filter is not None:
            group = group[group["title"].apply(title_filter)]
        needed = 0.5 * district_counts.get(int(domain), 0)
        chosen = None
        for year in YEARS:
            rows = group[group["year"] == year]
            if rows.empty:
                continue
            candidates = []
            for (var_id, turvar), subset in rows.groupby(["var_id", "turvar"]):
                count = subset["kode_i"].nunique()
                candidates.append(
                    (
                        bool(TOTAL_RE.search(turvar)),
                        count,
                        var_id,
                        turvar,
                        subset,
                    )
                )
            candidates = [
                candidate
                for candidate in candidates
                if candidate[1] >= max(3, needed)
            ]
            if not candidates:
                continue
            candidates.sort(key=lambda candidate: (candidate[0], candidate[1]), reverse=True)
            best = candidates[0]
            if not best[0] and len({candidate[3] for candidate in candidates}) > 1:
                ambiguous_total += 1
            chosen = (year, best[4])
            break
        if chosen:
            year, rows = chosen
            rows = rows.drop_duplicates("kode_i")
            for domain_id, value in zip(rows["kode_i"], rows["value_f"]):
                picked[concept][domain_id] = value
                picked_year[concept][domain_id] = year

    for concept, column in COLS.items():
        merged[column] = merged["domain_id"].map(picked[concept])
        merged[column + "_year"] = merged["domain_id"].map(picked_year[concept])

    DATA_PROC.mkdir(parents=True, exist_ok=True)
    merged.to_csv(MERGED_V2, index=False)
    print(f"\nsaved {MERGED_V2} ({len(merged)} rows)")
    print(
        f"(turvar picked without a clear 'total' label in "
        f"{ambiguous_total} province/concept cases)\n"
    )
    print(f"{'feature':<24}{'filled':>8}{'2024':>7}{'2023':>7}")
    for concept, column in COLS.items():
        years = merged[column + "_year"].value_counts()
        print(
            f"{column:<24}{merged[column].notna().sum():>8}"
            f"{years.get('2024', 0):>7}{years.get('2023', 0):>7}"
        )

    if "stunting_pct" in merged.columns:
        print("\ncorrelation with stunting_pct (filled rows only):")
        check = list(COLS.values()) + [
            column
            for column in ("ipm_kab", "akses_air_minum_layak_prov_pct")
            if column in merged.columns
        ]
        for column in check:
            sample = merged[[column, "stunting_pct"]].dropna()
            if len(sample) > 10:
                print(
                    f"  {column:<34} r = "
                    f"{sample[column].corr(sample['stunting_pct']):+.3f} "
                    f"  (n={len(sample)})"
                )
    return merged


if __name__ == "__main__":
    run()
