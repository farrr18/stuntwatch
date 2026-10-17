#!/usr/bin/env python3
"""
StuntWatch — Province viewer.
Usage:
    python province.py                  # list all provinces
    python province.py aceh             # full report for Aceh
    python province.py aceh --compact   # just the kabupaten list, no features
    python province.py aceh --csv       # dump to CSV file
"""
import sys, argparse
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
MERGED = ROOT / 'data' / 'processed' / 'stuntwatch_merged_v3.csv'
PREDS  = ROOT / 'models' / 'artifacts' / 'stuntwatch_predictions_v3.json'

# --- feature groups for display ---
FEATURE_GROUPS = {
    'Poverty': [
        'pct_penduduk_miskin', 'jml_penduduk_miskin', 'garis_kemiskinan',
        'indeks_kedalaman_p1', 'indeks_keparahan_p2',
    ],
    'Education': ['rls_kab', 'hls_kab'],
    'Economy': ['pengeluaran_kab', 'ipm_kab'],
    'WASH (province proxy)': [
        'akses_air_minum_layak_prov_pct', 'akses_sanitasi_aman_prov_pct',
    ],
    'WASH (kabupaten, when available)': [
        'air_minum_layak_kab', 'sanitasi_layak_kab',
    ],
    'Health services': [
        'pemantauan_pertumbuhan_sesuai_standar_prov_pct', 'RAI_total_pop',
        'RAI_children_u5',
    ],
    'Geography': ['rural_pop_perc', 'is_kota'],
}

def load_data():
    df = pd.read_csv(MERGED)
    # normalize province name from predictions json (ST format) - use kabupaten_kota_st as join
    df['kab'] = df['kabupaten_kota_st'].str.strip()
    return df

def resolve_province(df, query):
    """Match 'aceh', 'Aceh', 'nusa tenggara timur' → actual name."""
    q = query.lower().strip().replace('-', ' ')
    provinces = sorted(df['provinsi'].unique())
    for p in provinces:
        if p.lower() == q:
            return p
    # partial match
    matches = [p for p in provinces if q in p.lower()]
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        print(f"Multiple matches for '{query}': {', '.join(matches)}")
        sys.exit(1)
    print(f"Province '{query}' not found. Try: python province.py")
    sys.exit(1)

def list_all_provinces(df):
    print('\n═══ ALL PROVINCES ═══\n')
    summ = df.groupby('provinsi').agg(
        n=('kab', 'count'),
        avg_stunting=('stunting_pct', 'mean'),
        max_stunting=('stunting_pct', 'max'),
    ).round(1).sort_values('avg_stunting', ascending=False)
    print(summ.to_string())
    print(f'\nTotal: {len(summ)} provinces, {len(df)} kabupaten/kota\n')

def province_report(df, prov, compact=False, to_csv=False):
    sub = df[df['provinsi'] == prov].copy().sort_values('stunting_pct', ascending=False)
    if sub.empty:
        print(f"No kabupaten found for '{prov}'"); return

    # --- 1. Province summary ---
    print(f'\n{"═" * 78}')
    print(f'  PROVINCE: {prov.upper()}')
    print(f'{"═" * 78}\n')
    print(f'  Kabupaten/kota:         {len(sub)}')
    print(f'  Avg actual stunting:    {sub["stunting_pct"].mean():.1f}%')
    print(f'  Min / Max stunting:     {sub["stunting_pct"].min():.1f}% / {sub["stunting_pct"].max():.1f}%')
    print(f'  Highest-risk kabupaten: {sub.iloc[0]["kab"]} ({sub.iloc[0]["stunting_pct"]:.1f}%)')
    print(f'  Lowest-risk kabupaten:  {sub.iloc[-1]["kab"]} ({sub.iloc[-1]["stunting_pct"]:.1f}%)')
    if 'kategori_prevalensi_stunting' in sub.columns:
        tiers = sub['kategori_prevalensi_stunting'].value_counts()
        print(f'  Tier breakdown:')
        for t in ['Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah']:
            if t in tiers.index:
                print(f'    {t:<16} {tiers[t]:>3} kabupaten')

    # --- 2. Compact kabupaten list ---
    print(f'\n{"─" * 78}')
    print(f'  KABUPATEN RANKING (sorted by stunting prevalence, highest first)')
    print(f'{"─" * 78}\n')
    rank = sub[['kab', 'stunting_pct', 'kategori_prevalensi_stunting', 'jenis']].copy()
    rank.columns = ['Kabupaten/Kota', 'Stunting %', 'Tier', 'Jenis']
    rank.index = range(1, len(rank) + 1)
    print(rank.to_string())

    if compact:
        return

    # --- 3. Full feature table ---
    print(f'\n{"─" * 78}')
    print(f'  FULL FEATURE TABLE — {prov.upper()}')
    print(f'{"─" * 78}\n')
    for group_name, cols in FEATURE_GROUPS.items():
        present = [c for c in cols if c in sub.columns]
        if not present:
            continue
        print(f'\n  ◆ {group_name}')
        tbl = sub[['kab'] + present].copy()
        tbl = tbl.set_index('kab')
        # round numerics
        for c in present:
            tbl[c] = tbl[c].apply(lambda x: round(x, 2) if pd.notna(x) and isinstance(x, (int, float)) else x)
        print(tbl.to_string())

    # --- 4. Province aggregates for those features ---
    print(f'\n{"─" * 78}')
    print(f'  PROVINCE AGGREGATES (mean of all kabupaten)')
    print(f'{"─" * 78}\n')
    agg_rows = []
    for group_name, cols in FEATURE_GROUPS.items():
        for c in cols:
            if c in sub.columns and sub[c].notna().any():
                agg_rows.append({
                    'group': group_name,
                    'feature': c,
                    'mean': round(sub[c].mean(), 2),
                    'min': round(sub[c].min(), 2),
                    'max': round(sub[c].max(), 2),
                    'n_filled': int(sub[c].notna().sum()),
                })
    agg_df = pd.DataFrame(agg_rows)
    print(agg_df.to_string(index=False))

    # --- 5. CSV export ---
    if to_csv:
        out = ROOT / f'province_{prov.lower().replace(" ", "_")}.csv'
        sub.to_csv(out, index=False)
        print(f'\n✓ Saved full dataset to {out}')

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('province', nargs='?', help='Province name (e.g. aceh, papua, nusa tenggara timur)')
    ap.add_argument('--compact', action='store_true', help='Only show ranking table')
    ap.add_argument('--csv', action='store_true', help='Also save to CSV')
    args = ap.parse_args()

    df = load_data()

    if not args.province:
        list_all_provinces(df)
        return

    prov = resolve_province(df, args.province)
    province_report(df, prov, compact=args.compact, to_csv=args.csv)

if __name__ == '__main__':
    main()
