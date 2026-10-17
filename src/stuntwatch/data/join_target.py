import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import *

import pandas as pd, re

bps = pd.read_csv(BPS_CSV)
st  = pd.read_csv(TARGET_CSV)

def base_name(s):
    s = str(s).lower().strip()
    s = re.sub(r'^(kabupaten|kab\.?|kota|kotamadya)\s+', '', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

suffix = bps['domain_id'].astype(str).str[-2:].astype(int)
bps['jenis'] = (suffix >= 71).map({True:'kota', False:'kab'})
bps['base']  = bps['kabupaten_kota'].apply(base_name)

st['jenis'] = st['kabupaten_kota'].str.lower().str.strip().str.startswith('kota ').map({True:'kota', False:'kab'})
st['base']  = st['kabupaten_kota'].apply(base_name)

# renames
bps.loc[bps['kabupaten_kota'].str.contains('Maluku Tenggara Barat', na=False), 'base'] = 'kepulauantanimbar'
bps.loc[bps['kabupaten_kota'].str.strip() == 'Kota Baru', 'base'] = 'kotabaru'
st.loc[st['base'].str.replace('.', '', regex=False) == 'keptanimbar', 'base'] = 'kepulauantanimbar'

# jenis overrides on ST (these ARE kota, ST just omitted the prefix)
st.loc[st['base'] == 'sibolga', 'jenis'] = 'kota'
st.loc[st['base'] == 'tidorekepulauan', 'jenis'] = 'kota'

merged = bps.merge(st, on=['jenis','base'], how='outer', indicator=True, suffixes=('_bps','_st'))
print(merged['_merge'].value_counts())
print('Total:', len(merged))

print('\n-- only bps --')
print(merged.loc[merged['_merge']=='left_only', ['kabupaten_kota_bps','jenis','base']].to_string())
print('\n-- only st --')
print(merged.loc[merged['_merge']=='right_only', ['kabupaten_kota_st','jenis','base']].to_string())

dups = merged[merged.duplicated(['jenis','base'], keep=False)]
print('\n-- remaining dup:', len(dups))
if len(dups): print(dups[['kabupaten_kota_bps','kabupaten_kota_st','jenis','base']].to_string())

# save merged for training
merged.to_csv(MERGED_V1, index=False)
print('\nsaved stuntwatch_merged.csv, shape:', merged.shape)
print('columns:', merged.columns.tolist())
