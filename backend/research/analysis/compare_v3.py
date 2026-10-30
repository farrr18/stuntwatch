import pandas as pd, numpy as np, xgboost as xgb
from sklearn.model_selection import GroupKFold, LeaveOneGroupOut
from sklearn.metrics import mean_absolute_error, r2_score
from stuntwatch.utils.config import MERGED_V1, MERGED_V2, MERGED_V3

def run(df, feats, name, splitter='gkf'):
    df = df.dropna(subset=['stunting_pct']).copy()
    for c in ['akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
              'pemantauan_pertumbuhan_sesuai_standar_prov_pct']:
        if c in feats:
            df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
            df[c] = df[c].fillna(df[c].median())
    X, y, g = df[feats].values, df['stunting_pct'].values, df['provinsi'].values
    mae, r2 = [], []
    sp = LeaveOneGroupOut() if splitter == 'logo' else GroupKFold(n_splits=5)
    for tr, te in sp.split(X, y, g):
        m = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                             subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                             random_state=42, n_jobs=-1).fit(X[tr], y[tr])
        p = m.predict(X[te])
        mae.append(mean_absolute_error(y[te], p))
        r2.append(r2_score(y[te], p))
    print(f'{name:<50} n={len(df):>4}  MAE={np.mean(mae):.3f}  R2={np.mean(r2):.3f}')

d = pd.read_csv(MERGED_V3)

base = ['pct_penduduk_miskin','jml_penduduk_miskin','garis_kemiskinan',
        'indeks_kedalaman_p1','indeks_keparahan_p2','ipm_kab',
        'akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
        'pemantauan_pertumbuhan_sesuai_standar_prov_pct']
derived = ['depth_severity_ratio','implied_pop','is_kota']
v2_dense = ['rls_kab','hls_kab','pengeluaran_kab']
v2_wash  = ['air_minum_layak_kab','sanitasi_layak_kab']
hdx_strong = ['rural_pop_perc','RAI_total_pop']

d['depth_severity_ratio'] = d['indeks_kedalaman_p1']/d['indeks_keparahan_p2'].replace(0, np.nan)
d['implied_pop'] = d['jml_penduduk_miskin']/d['pct_penduduk_miskin'].replace(0, np.nan)*100
d['is_kota'] = (d['jenis'] == 'kota').astype(int)
for c in base[:-3]:
    d[c] = d.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
    d[c] = d[c].fillna(d[c].median())
d['depth_severity_ratio'] = d['depth_severity_ratio'].fillna(d['depth_severity_ratio'].median())

run(d, base + derived + v2_dense + v2_wash, 'V2-B baseline (GKfold)')
run(d, base + derived + v2_dense + v2_wash + hdx_strong, 'V3-A: +rural+RAI (GKfold)')
run(d, base + derived + v2_dense + v2_wash + hdx_strong + ['RAI_children_u5'],
    'V3-B: +rural+RAI+both RAI (GKfold)')

print()
run(d, base + derived + v2_dense + v2_wash, 'V2-B baseline (LOPO)')
run(d, base + derived + v2_dense + v2_wash + hdx_strong, 'V3-A: +rural+RAI (LOPO)')
