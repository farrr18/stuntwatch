import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import *

import re, sys
import pandas as pd

LONG = WASH_LONG
MERGED = MERGED_V1
OUT = MERGED_V2

COLS = {
    "air_minum_layak": "air_minum_layak_kab",
    "sanitasi_layak": "sanitasi_layak_kab",
    "rls": "rls_kab",
    "hls": "hls_kab",
    "uhh": "uhh_kab",
    "pengeluaran": "pengeluaran_kab",
}

# extra title filters so we don't pick an index / wrong measure by accident
TITLE_OK = {
    "rls": lambda t: "indeks" not in t.lower(),
    "hls": lambda t: "indeks" not in t.lower(),
    "uhh": lambda t: "indeks" not in t.lower(),
    "pengeluaran": lambda t: "disesuaikan" in t.lower(),
}
TOTAL_RE = re.compile(r"total|jumlah|perkotaan\s*\+|kota\s*\+|^\s*$", re.I)
YEARS = ("2024", "2023")  # nothing older: stale WASH is a different feature

m = pd.read_csv(MERGED_V1)
if "domain_id" not in m.columns:
    print("No 'domain_id' column in", MERGED, "- columns are:")
    print(list(m.columns))
    sys.exit(1)
m["domain_id"] = pd.to_numeric(m["domain_id"], errors="coerce").astype("Int64")
valid = set(m["domain_id"].dropna().astype(int))
kab_count = m.dropna(subset=["domain_id"]).groupby((m["domain_id"] // 100) * 100).size().to_dict()

L = pd.read_csv(LONG, dtype={"domain": str})
L["kode_i"] = pd.to_numeric(L["kode"], errors="coerce")

import re as _re
def _norm(x):
    x = str(x).lower()
    x = _re.sub(r"\b(kabupaten|kab|kota|adm)\b\.?", "", x)
    return _re.sub(r"[^a-z]", "", x)

name_col = "kabupaten_kota_bps" if "kabupaten_kota_bps" in m.columns else "kabupaten_kota_st"
lookup = {}
for did, nm in zip(m["domain_id"].dropna().astype(int), m[name_col]):
    lookup.setdefault((did // 100 * 100, _norm(nm)), did)

L["dom_i"] = pd.to_numeric(L["domain"], errors="coerce")
L["kode_i"] = L["kode_i"].astype("float64")
bad = ~L["kode_i"].isin(valid)
L.loc[bad, "kode_i"] = [lookup.get((int(d), _norm(l)), float("nan"))
                        for d, l in zip(L.loc[bad, "dom_i"], L.loc[bad, "label"])]
print("recovered by name:", int(bad.sum() - L.loc[bad, "kode_i"].isna().sum()), "of", int(bad.sum()))
L["value_f"] = pd.to_numeric(L["value"].astype(str).str.replace(",", ".", regex=False), errors="coerce")
L["year"] = L["year"].astype(str).str.extract(r"(\d{4})")[0]
L["turvar"] = L["turvar"].fillna("").astype(str)

# how well do BPS codes line up with domain_id?
recent = L[L["year"].isin(YEARS) & L["value_f"].notna()]
print(f"rows with 2023/2024 values: {len(recent)}; kode found in merged domain_id: "
      f"{recent['kode_i'].isin(valid).mean():.0%}")
L = L[L["kode_i"].isin(valid) & L["value_f"].notna()].copy()
L["kode_i"] = L["kode_i"].astype(int)

picked = {c: {} for c in COLS}      # concept -> {domain_id: value}
picked_year = {c: {} for c in COLS}
warn_turvar = 0

for (dom, concept), g in L.groupby(["domain", "concept"]):
    ok = TITLE_OK.get(concept)
    if ok is not None:
        g = g[g["title"].apply(ok)]
    need = 0.5 * kab_count.get(int(dom), 0)
    chosen = None
    for yr in YEARS:
        sub = g[g["year"] == yr]
        if sub.empty:
            continue
        pairs = []
        for (vid, tv), s in sub.groupby(["var_id", "turvar"]):
            n = s["kode_i"].nunique()
            pairs.append((bool(TOTAL_RE.search(tv)), n, vid, tv, s))
        pairs = [p for p in pairs if p[1] >= max(3, need)] or []
        if not pairs:
            continue
        pairs.sort(key=lambda p: (p[0], p[1]), reverse=True)
        best = pairs[0]
        if not best[0] and len({p[3] for p in pairs}) > 1:
            warn_turvar += 1
        chosen = (yr, best[4])
        break
    if chosen:
        yr, s = chosen
        s = s.drop_duplicates("kode_i")
        for k, v in zip(s["kode_i"], s["value_f"]):
            picked[concept][k] = v
            picked_year[concept][k] = yr

for concept, col in COLS.items():
    m[col] = m["domain_id"].map(picked[concept])
    m[col + "_year"] = m["domain_id"].map(picked_year[concept])

m.to_csv(OUT, index=False)

print(f"\nsaved {OUT}  ({len(m)} rows)")
print(f"(turvar picked without a clear 'total' label in {warn_turvar} province/concept cases)\n")
print(f"{'feature':<24}{'filled':>8}{'2024':>7}{'2023':>7}")
for concept, col in COLS.items():
    yrs = m[col + "_year"].value_counts()
    print(f"{col:<24}{m[col].notna().sum():>8}{yrs.get('2024', 0):>7}{yrs.get('2023', 0):>7}")

if "stunting_pct" in m.columns:
    print("\ncorrelation with stunting_pct (filled rows only):")
    check = list(COLS.values()) + [c for c in ("ipm_kab", "akses_air_minum_layak_prov_pct") if c in m.columns]
    for c in check:
        s = m[[c, "stunting_pct"]].dropna()
        if len(s) > 10:
            print(f"  {c:<34} r = {s[c].corr(s['stunting_pct']):+.3f}   (n={len(s)})")
