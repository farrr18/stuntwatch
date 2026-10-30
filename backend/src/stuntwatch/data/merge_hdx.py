import numpy as np
import pandas as pd

from ..utils.config import DATA_PROC, HDX_DIR, MERGED_V2, MERGED_V3


def to_domain(pcode: object) -> int | float:
    digits = "".join(character for character in str(pcode) if character.isdigit())
    return int(digits) if digits else np.nan


def run() -> pd.DataFrame:
    merged = pd.read_csv(MERGED_V2)
    facilities = pd.read_csv(HDX_DIR / "idn_adm2_facilities.csv")
    demographics = pd.read_csv(HDX_DIR / "idn_adm2_demographics.csv")
    rural = pd.read_csv(HDX_DIR / "idn_adm2_rural_population.csv")
    rai = pd.read_csv(HDX_DIR / "idn_adm2_rai.csv")

    print("sample ADM2_PCODE:", facilities["ADM2_PCODE"].head(3).tolist())
    for dataset in (facilities, demographics, rural, rai):
        dataset["domain_id"] = dataset["ADM2_PCODE"].apply(to_domain)

    facility_demographics = facilities.merge(
        demographics[["domain_id", "total_pop", "children_u5", "wra_pop"]],
        on="domain_id",
        how="inner",
    )
    facility_demographics["puskesmas_per_100k"] = (
        facility_demographics["primary_healthcare_count"]
        / facility_demographics["total_pop"].replace(0, np.nan)
        * 100_000
    )
    facility_demographics["hospitals_per_100k"] = (
        facility_demographics["hospitals_count"]
        / facility_demographics["total_pop"].replace(0, np.nan)
        * 100_000
    )
    facility_demographics["edu_facility_per_100k"] = (
        facility_demographics["education_count"]
        / facility_demographics["total_pop"].replace(0, np.nan)
        * 100_000
    )
    features = facility_demographics[
        [
            "domain_id",
            "puskesmas_per_100k",
            "hospitals_per_100k",
            "edu_facility_per_100k",
        ]
    ].copy()

    rural_features = rural.merge(
        demographics[["domain_id", "total_pop"]],
        on="domain_id",
        how="left",
    )
    features = features.merge(
        rural_features[
            [
                "domain_id",
                "rural_pop_perc",
                "total_pop_rural",
                "dependency_ratio_rural",
            ]
        ],
        on="domain_id",
        how="left",
    )
    features = features.merge(
        rai[["domain_id", "RAI_total_pop", "RAI_children_u5"]],
        on="domain_id",
        how="left",
    )
    merged = merged.merge(features, on="domain_id", how="left")

    print("\n=== coverage ===")
    columns = [
        "puskesmas_per_100k",
        "hospitals_per_100k",
        "edu_facility_per_100k",
        "rural_pop_perc",
        "total_pop_rural",
        "dependency_ratio_rural",
        "RAI_total_pop",
        "RAI_children_u5",
    ]
    for column in columns:
        count = merged[column].notna().sum()
        print(f"  {column:<28} {count:>4}/{len(merged)} ({count / len(merged) * 100:.0f}%)")

    print("\n=== correlations with stunting_pct ===")
    for column in [
        "puskesmas_per_100k",
        "hospitals_per_100k",
        "edu_facility_per_100k",
        "rural_pop_perc",
        "RAI_total_pop",
        "RAI_children_u5",
    ]:
        sample = merged[[column, "stunting_pct"]].dropna()
        if len(sample) > 20:
            print(
                f"  {column:<28} r = "
                f"{sample[column].corr(sample['stunting_pct']):+.3f} "
                f"(n={len(sample)})"
            )

    DATA_PROC.mkdir(parents=True, exist_ok=True)
    merged.to_csv(MERGED_V3, index=False)
    print("\nsaved", MERGED_V3.name, merged.shape)
    return merged


if __name__ == "__main__":
    run()
