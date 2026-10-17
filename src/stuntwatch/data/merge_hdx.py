import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import *

import pandas as pd, numpy as np

m = pd.read_csv(MERGED_V2)

fac  = pd.read_csv(HDX_DIR / 'idn_adm2_facilities.csv')
demo = pd.read_csv(HDX_DIR / 'idn_adm2_demographics.csv')
rur  = pd.read_csv(HDX_DIR / 'idn_adm2_rural_population.csv')
rai  = pd.read_csv(HDX_DIR / 'idn_adm2_rai.csv')

# --- normalize ADM2_PCODE -> domain_id ---
# BPS codes in your domain_id look like 1101 (Aceh), 9471 (Jayapura)
# ADM2_PCODE looks like "ID1101" or similar - inspect first
print('sample ADM2_PCODE:', fac['ADM2_PCODE'].head(3).tolist())

def to_domain(pcode):
    s = str(pcode)
    # strip any non-digit prefix
    digits = ''.join(c for c in s if c.isdigit())
    return int(digits) if digits else np.nan

for d in (fac, demo, rur, rai):
    d['domain_id'] = d['ADM2_PCODE'].apply(to_domain)

# --- build features ---
fd = fac.merge(demo[['domain_id','total_pop','children_u5','wra_pop']], on='domain_id', how='inner')
fd['puskesmas_per_100k'] = fd['primary_healthcare_count'] / fd['total_pop'].replace(0,np.nan) * 100_000
fd['hospitals_per_100k']  = fd['hospitals_count'] / fd['total_pop'].replace(0,np.nan) * 100_000
fd['edu_facility_per_100k'] = fd['education_count'] / fd['total_pop'].replace(0,np.nan) * 100_000

new = fd[['domain_id','puskesmas_per_100k','hospitals_per_100k','edu_facility_per_100k']].copy()

# rural: use rural_pop_perc, and also compute a rurality index from rural vs total
rr = rur.merge(demo[['domain_id','total_pop']], on='domain_id', how='left')
rr['rural_pop_abs'] = rr['total_pop_rural']
rr['u5_rural_share'] = rr['children_u5_rural'] / rr['children_u5'].replace(0,np.nan) if 'children_u5' in rr.columns else np.nan
new = new.merge(
    rr[['domain_id','rural_pop_perc','total_pop_rural','dependency_ratio_rural']],
    on='domain_id', how='left'
)

# RAI: rural access index - lower = worse access
new = new.merge(
    rai[['domain_id','RAI_total_pop','RAI_children_u5']],
    on='domain_id', how='left'
)

# --- attach to merged ---
m = m.merge(new, on='domain_id', how='left')

print('\n=== coverage on 514 rows ===')
for c in ['puskesmas_per_100k','hospitals_per_100k','edu_facility_per_100k',
          'rural_pop_perc','total_pop_rural','dependency_ratio_rural',
          'RAI_total_pop','RAI_children_u5']:
    n = m[c].notna().sum()
    print(f'  {c:<28} {n:>4}/514  ({n/514*100:.0f}%)')

print('\n=== correlations with stunting_pct ===')
for c in ['puskesmas_per_100k','hospitals_per_100k','edu_facility_per_100k',
          'rural_pop_perc','RAI_total_pop','RAI_children_u5']:
    s = m[[c,'stunting_pct']].dropna()
    if len(s) > 20:
        print(f'  {c:<28} r = {s[c].corr(s["stunting_pct"]):+.3f}  (n={len(s)})')

m.to_csv(MERGED_V3, index=False)
print('\nsaved stuntwatch_merged_v3.csv', m.shape)
