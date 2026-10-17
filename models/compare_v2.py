import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'pipeline'))
from _paths import MERGED_V1, MERGED_V2, MERGED_V3

import pandas as pd, numpy as np, xgboost as xgb
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_absolute_error, r2_score

def run(df, feats, name):
    df = df.copy()
    # only drop if TARGET missing
    df = df.dropna(subset=['stunting_pct']).reset_index(drop=True)
    # impute province-level constants only (they're always NaN for entire provinces)
    for c in feats:
        if c in ['akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
                 'pemantauan_pertumbuhan_sesuai_standar_prov_pct']:
            df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
            df[c] = df[c].fillna(df[c].median())
    X, y, g = df[feats].values, df['stunting_pct'].values, df['provinsi'].values
    mae, r2 = [], []
    for tr, te in GroupKFold(n_splits=5).split(X, y, g):
        m = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                             subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                             random_state=42, n_jobs=-1).fit(X[tr], y[tr])
        p = m.predict(X[te])
        mae.append(mean_absolute_error(y[te], p))
        r2.append(r2_score(y[te], p))
    print(f'{name:<45} n={len(df):>4}  MAE={np.mean(mae):.3f}  R2={np.mean(r2):.3f}')

d1 = pd.read_csv(MERGED_V1)
d2 = pd.read_csv(MERGED_V2)
for c in ['akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
          'pemantauan_pertumbuhan_sesuai_standar_prov_pct']:
    d2[c] = d1[c].values

base = ['pct_penduduk_miskin','jml_penduduk_miskin','garis_kemiskinan',
        'indeks_kedalaman_p1','indeks_keparahan_p2','ipm_kab',
        'akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
        'pemantauan_pertumbuhan_sesuai_standar_prov_pct']
derived = ['depth_severity_ratio','implied_pop','is_kota']

for d in (d1, d2):
    d['depth_severity_ratio'] = d['indeks_kedalaman_p1']/d['indeks_keparahan_p2'].replace(0,np.nan)
    d['implied_pop'] = d['jml_penduduk_miskin']/d['pct_penduduk_miskin'].replace(0,np.nan)*100
    d['is_kota'] = (d['jenis']=='kota').astype(int)
    for c in base[:-3]:  # the kab-level base cols
        d[c] = d.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
        d[c] = d[c].fillna(d[c].median())
    d['depth_severity_ratio'] = d['depth_severity_ratio'].fillna(d['depth_severity_ratio'].median())

run(d1, base+derived, 'V1 baseline (all filled, n~514)')
run(d2, base+derived, 'V2-0: no new feats (same as V1, n~514)')
run(d2, base+derived+['rls_kab','hls_kab','pengeluaran_kab'], 'V2-A: +dense (NaN kept)')
run(d2, base+derived+['rls_kab','hls_kab','pengeluaran_kab',
                      'air_minum_layak_kab','sanitasi_layak_kab'],
    'V2-B: +dense+WASH (NaN kept)')

base2 = [c for c in base if c!='akses_air_minum_layak_prov_pct']
run(d2, base2+derived+['rls_kab','hls_kab','pengeluaran_kab',
                       'air_minum_layak_kab','sanitasi_layak_kab'],
    'V2-C: drop prov-water, use kab-water')
