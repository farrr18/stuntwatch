#!/usr/bin/env python3
import sys, json, requests
import pandas as pd
from stuntwatch.utils.config import MERGED_V3

# ANSI Colors
C_RESET = '\033[0m'
C_BOLD = '\033[1m'
C_RED = '\033[91m'
C_GREEN = '\033[92m'
C_YELLOW = '\033[93m'
C_BLUE = '\033[94m'
C_CYAN = '\033[96m'

API_URL = "http://localhost:8000/api"
MERGED = MERGED_V3

def get_tier_color(pct):
    if pct < 20: return C_GREEN
    if pct < 30: return C_YELLOW
    if pct < 40: return C_RED
    return f"{C_BOLD}{C_RED}"

def check_api():
    try:
        r = requests.get(f"{API_URL}/health", timeout=2)
        return r.status_code == 200
    except:
        print(f"{C_RED}Error: FastAPI server is not running. Start it with: uvicorn stuntwatch.api.main:app --reload{C_RESET}")
        sys.exit(1)

def load_provinces():
    r = requests.get(f"{API_URL}/provinces")
    return r.json()

def main():
    check_api()
    df = pd.read_csv(MERGED)
    provinces = load_provinces()

    while True:
        print(f"\n{C_CYAN}══════════════════════════════════════════════════════════════════════════{C_RESET}")
        print(f"{C_BOLD}  STUNTWATCH CLI — National Overview{C_RESET}")
        print(f"{C_CYAN}══════════════════════════════════════════════════════════════════════════{C_RESET}")
        
        # Show top 10 provinces
        print(f"  {C_BOLD}{'Rank':<5} {'Province':<25} {'Avg Risk':<10} {'Max Risk':<10} {'Tier Breakdown'}{C_RESET}")
        print(f"  {'─'*5} {'─'*25} {'─'*10} {'─'*10} {'─'*30}")
        for i, p in enumerate(provinces[:10], 1):
            color = get_tier_color(p['avg_predicted'])
            tiers = p['tier_counts']
            breakdown = f"Tinggi:{tiers['Tinggi']} SangatTinggi:{tiers['Sangat Tinggi']}"
            print(f"  {i:<5} {p['province']:<25} {color}{p['avg_predicted']:>5.1f}%{C_RESET}     {p['max_predicted']:>5.1f}%     {breakdown}")

        print(f"\n  {C_BOLD}[1-{len(provinces)}]{C_RESET} Select province | {C_BOLD}[q]{C_RESET} Quit")
        choice = input(f"\n{C_BOLD}> {C_RESET}").strip().lower()

        if choice in ('q', 'quit', 'exit'):
            break
            
        if not choice.isdigit() or not (1 <= int(choice) <= len(provinces)):
            print(f"{C_RED}Invalid choice.{C_RESET}")
            continue

        selected = provinces[int(choice)-1]
        prov_name = selected['province']
        
        # Fetch province details and raw data
        prov_data = requests.get(f"{API_URL}/provinsi/{prov_name}").json()
        df_prov = df[df['provinsi'] == prov_name].sort_values('pct_penduduk_miskin', ascending=False)

        print(f"\n{C_CYAN}══════════════════════════════════════════════════════════════════════════{C_RESET}")
        print(f"{C_BOLD}  {prov_name.upper()} — {selected['n_kabupaten']} Districts{C_RESET}")
        print(f"{C_CYAN}══════════════════════════════════════════════════════════════════════════{C_RESET}")
        
        print(f"  {C_BOLD}Data Confidence:{C_RESET} {selected.get('data_confidence', 'mixed')} | {C_BOLD}Province Risk:{C_RESET} {selected['avg_predicted']:.1f}% (Avg) | {selected['max_predicted']:.1f}% (Max)")
        print(f"  {C_BOLD}Primary Driver (SHAP):{C_RESET} {selected['highest_risk_kabupaten']} is flagged as highest risk.\n")

        # Show districts sorted by POVERTY (actionable raw data), not model prediction
        print(f"  {C_BOLD}Districts sorted by Priority Indicator (Poverty Rate):{C_RESET}")
        print(f"  {C_BOLD}{'No':<5} {'District':<22} {'Poverty':<10} {'Actual':<10} {'Predict':<10} {'Tier'}{C_RESET}")
        print(f"  {'─'*5} {'─'*22} {'─'*10} {'─'*10} {'─'*10} {'─'*15}")
        
        for i, (_, row) in enumerate(df_prov.head(10).iterrows(), 1):
            color = get_tier_color(row['stunting_pct'])
            # Fetch prediction from API map (requires using the loaded provinces data)
            pred_val = next((k['prediction'] for k in prov_data['kabupaten'] if k['domain_id'] == row['domain_id']), 0.0)
            pred_color = get_tier_color(pred_val)
            print(f"  {i:<5} {row['kabupaten_kota_st']:<22} {row['pct_penduduk_miskin']:>5.1f}%    {color}{row['stunting_pct']:>5.1f}%{C_RESET}    {pred_color}{pred_val:>5.1f}%{C_RESET}    {row['kategori_prevalensi_stunting']}")

        print(f"\n  {C_BOLD}[1-{min(10, len(df_prov))}]{C_RESET} Select district for AI brief | {C_BOLD}[b]{C_RESET} Back to national")
        dist_choice = input(f"\n{C_BOLD}> {C_RESET}").strip().lower()

        if dist_choice == 'b':
            continue
            
        if not dist_choice.isdigit() or not (1 <= int(dist_choice) <= min(10, len(df_prov))):
            print(f"{C_RED}Invalid choice.{C_RESET}")
            continue

        # Get selected district
        target_dist = df_prov.iloc[int(dist_choice)-1]
        domain_id = int(target_dist['domain_id'])
        
        print(f"\n{C_CYAN}─── Generating AI Policy Brief for {target_dist['kabupaten_kota_st']} ───{C_RESET}")
        print(f"{C_YELLOW}(This takes 2-4 seconds...){C_RESET}")
        
        try:
            # First get SHAP data
            detail = requests.get(f"{API_URL}/kabupaten/{domain_id}").json()
            print(f"\n{C_BOLD}SHAP Top Drivers:{C_RESET}")
            for f in detail.get('top_features', [])[:5]:
                arrow = "▲" if f['shap'] > 0 else "▼"
                color = C_RED if f['shap'] > 0 else C_GREEN
                print(f"  {color}{arrow}{C_RESET} {f['name']:<45} {f['shap']:+.2f}")
            
            # Then get narrative
            resp = requests.get(f"{API_URL}/kabupaten/{domain_id}/narrative")
            narr_data = resp.json()
            
            if resp.status_code == 200 and 'narrative' in narr_data:
                print(f"\n{C_BOLD}AI Narrative:{C_RESET}")
                print(narr_data['narrative'])
            else:
                print(f"\n{C_RED}AI Error: {narr_data.get('detail', 'Unknown error')}{C_RESET}")
                
            print(f"\n{C_CYAN}{'═'*70}{C_RESET}")
            input(f"\n{C_BOLD}Press Enter to continue...{C_RESET}")
            
        except Exception as e:
            print(f"{C_RED}System Error: {e}{C_RESET}")
            input(f"\n{C_BOLD}Press Enter to continue...{C_RESET}")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{C_RESET}Exiting.")
        sys.exit(0)
