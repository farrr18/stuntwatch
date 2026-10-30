"""
StuntWatch — BPS WebAPI Data Puller v2
Pull proxy variables per kabupaten/kota → export CSV
"""
import argparse
import csv
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

from ..utils.config import BPS_CSV

load_dotenv()
API_KEY = os.getenv("BPS_API_KEY")
BASE    = "https://webapi.bps.go.id/v1/api"
HEADERS = {"User-Agent": "Mozilla/5.0"}

VARS = {
    621: "pct_penduduk_miskin",
    619: "jml_penduduk_miskin",
    624: "garis_kemiskinan",
    622: "indeks_kedalaman_p1",
    623: "indeks_keparahan_p2",
    147: "sanitasi_bab",
    413: "ipm_kab",
}
YEAR_MAP = {2024: 124, 2023: 123, 2022: 122, 2021: 121, 2020: 120}

def get(endpoint):
    if not API_KEY:
        raise RuntimeError("BPS_API_KEY is required to download BPS data.")
    url = f"{BASE}/{endpoint}/key/{API_KEY}"
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            r.raise_for_status()
            return r.json()
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(2)

def get_all_domains():
    data = get("domain/type/kab")
    items = data["data"][1]
    return {item["domain_id"]: item["domain_name"] for item in items}

def parse_datacontent(dc, var_id):
    var_s = str(var_id)
    result = {}
    for key, val in dc.items():
        k = str(key)
        idx = k.find(var_s)
        if idx < 4: continue
        domain = k[:4]
        if domain not in result:
            result[domain] = val
    return result

def fetch_var(var_id, th_id):
    data = get(f"list/model/data/domain/0000/var/{var_id}/th/{th_id}")
    if data.get("data-availability") != "available":
        print(f"  [SKIP] var {var_id}"); return {}
    dc = data.get("datacontent", {})
    if not dc or not isinstance(dc, dict):
        print(f"  [EMPTY] var {var_id}"); return {}
    result = parse_datacontent(dc, var_id)
    return result

def run(year, outfile):
    th_id = YEAR_MAP.get(year)
    if not th_id:
        raise ValueError(f"Year {year} is not supported. Choose one of {sorted(YEAR_MAP)}.")
    outfile = Path(outfile)
    outfile.parent.mkdir(parents=True, exist_ok=True)
    print("Fetching all kabupaten/kota domains...")
    domains = get_all_domains()
    print(f"  {len(domains)} kabupaten/kota found")
    all_data = {}
    for var_id, label in VARS.items():
        print(f"Fetching var {var_id} ({label})...")
        vdata = fetch_var(var_id, th_id)
        print(f"  Got {len(vdata)} values")
        for domain, val in vdata.items():
            all_data.setdefault(domain, {})[label] = val
        time.sleep(0.3)
    cols = ["domain_id", "kabupaten_kota"] + list(VARS.values())
    rows = []
    for domain_id, name in domains.items():
        row = {"domain_id": domain_id, "kabupaten_kota": name}
        row.update(all_data.get(domain_id, {}))
        rows.append(row)
    with open(outfile, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    filled = sum(1 for r in rows if any(r.get(c) for c in VARS.values()))
    print(f"\nDone. {filled}/{len(rows)} kab/kota have data → {outfile}")
    print(f"Coverage: {filled/len(rows)*100:.1f}%")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--out", type=Path, default=BPS_CSV)
    args = parser.parse_args()
    run(args.year, args.out)
