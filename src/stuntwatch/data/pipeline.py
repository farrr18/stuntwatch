import argparse
import os
from pathlib import Path

from . import join_target, merge_hdx, merge_wash, pull_bps
from ..utils.config import BPS_CSV, HDX_INPUTS, MERGED_V3, TARGET_CSV, WASH_LONG

REQUIRED_INPUTS = (TARGET_CSV, WASH_LONG, *HDX_INPUTS)


def validate_inputs() -> None:
    missing = [path for path in REQUIRED_INPUTS if not path.is_file()]
    if missing:
        paths = "\n".join(f"  - {path}" for path in missing)
        raise FileNotFoundError(
            "Pipeline source data is missing. Add the required files as described "
            f"in data/raw/README.md:\n{paths}"
        )
    if not os.getenv("BPS_API_KEY"):
        raise RuntimeError(
            "BPS_API_KEY is required. Set it in your environment or in a local .env file."
        )


def run(year: int = 2024) -> Path:
    validate_inputs()
    pull_bps.run(year, BPS_CSV)
    join_target.run()
    merge_wash.run()
    merge_hdx.run()
    return MERGED_V3


def main() -> None:
    parser = argparse.ArgumentParser(description="Build StuntWatch's merged dataset.")
    parser.add_argument("--year", type=int, default=2024)
    args = parser.parse_args()
    run(args.year)


if __name__ == "__main__":
    main()
