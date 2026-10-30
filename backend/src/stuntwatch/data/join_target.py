import re

import pandas as pd

from ..utils.config import BPS_CSV, DATA_PROC, MERGED_V1, TARGET_CSV


def base_name(value: object) -> str:
    name = str(value).lower().strip()
    name = re.sub(r"^(kabupaten|kab\.?|kota|kotamadya)\s+", "", name)
    return re.sub(r"[^a-z0-9]", "", name)


def run() -> pd.DataFrame:
    bps = pd.read_csv(BPS_CSV)
    stunting = pd.read_csv(TARGET_CSV)

    suffix = bps["domain_id"].astype(str).str[-2:].astype(int)
    bps["jenis"] = (suffix >= 71).map({True: "kota", False: "kab"})
    bps["base"] = bps["kabupaten_kota"].apply(base_name)

    stunting["jenis"] = (
        stunting["kabupaten_kota"]
        .str.lower()
        .str.strip()
        .str.startswith("kota ")
        .map({True: "kota", False: "kab"})
    )
    stunting["base"] = stunting["kabupaten_kota"].apply(base_name)

    bps.loc[
        bps["kabupaten_kota"].str.contains("Maluku Tenggara Barat", na=False),
        "base",
    ] = "kepulauantanimbar"
    bps.loc[bps["kabupaten_kota"].str.strip() == "Kota Baru", "base"] = "kotabaru"
    stunting.loc[
        stunting["base"].str.replace(".", "", regex=False) == "keptanimbar",
        "base",
    ] = "kepulauantanimbar"
    stunting.loc[stunting["base"] == "sibolga", "jenis"] = "kota"
    stunting.loc[stunting["base"] == "tidorekepulauan", "jenis"] = "kota"

    merged = bps.merge(
        stunting,
        on=["jenis", "base"],
        how="outer",
        indicator=True,
        suffixes=("_bps", "_st"),
    )
    print(merged["_merge"].value_counts())
    print("Total:", len(merged))
    print("\n-- only bps --")
    print(
        merged.loc[merged["_merge"] == "left_only", [
            "kabupaten_kota_bps",
            "jenis",
            "base",
        ]].to_string()
    )
    print("\n-- only st --")
    print(
        merged.loc[merged["_merge"] == "right_only", [
            "kabupaten_kota_st",
            "jenis",
            "base",
        ]].to_string()
    )
    duplicates = merged[merged.duplicated(["jenis", "base"], keep=False)]
    print("\n-- remaining dup:", len(duplicates))
    if len(duplicates):
        print(
            duplicates[[
                "kabupaten_kota_bps",
                "kabupaten_kota_st",
                "jenis",
                "base",
            ]].to_string()
        )

    DATA_PROC.mkdir(parents=True, exist_ok=True)
    merged.to_csv(MERGED_V1, index=False)
    print("\nsaved", MERGED_V1.name, "shape:", merged.shape)
    print("columns:", merged.columns.tolist())
    return merged


if __name__ == "__main__":
    run()
