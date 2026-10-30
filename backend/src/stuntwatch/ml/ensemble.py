import pandas as pd, numpy as np, json
import xgboost as xgb
from sklearn.model_selection import KFold
from sklearn.metrics import mean_absolute_error, r2_score
from stuntwatch.utils.config import DATA_PROC, MERGED_V3

df = pd.read_csv(MERGED_V3)

base = ['pct_penduduk_miskin','jml_penduduk_miskin','garis_kemiskinan',
        'indeks_kedalaman_p1','indeks_keparahan_p2','ipm_kab',
        'akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
        'pemantauan_pertumbuhan_sesuai_standar_prov_pct']
v2_dense = ['rls_kab','hls_kab','pengeluaran_kab']
v2_wash  = ['air_minum_layak_kab','sanitasi_layak_kab']
hdx      = ['rural_pop_perc','RAI_total_pop','RAI_children_u5']
derived  = ['depth_severity_ratio','implied_pop','is_kota']
feats = base + derived + v2_dense + v2_wash + hdx

for c in ['akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
          'pemantauan_pertumbuhan_sesuai_standar_prov_pct']:
    df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
    df[c] = df[c].fillna(df[c].median())
df['depth_severity_ratio'] = df['indeks_kedalaman_p1']/df['indeks_keparahan_p2'].replace(0,np.nan)
df['implied_pop'] = df['jml_penduduk_miskin']/df['pct_penduduk_miskin'].replace(0,np.nan)*100
df['is_kota'] = (df['jenis']=='kota').astype(int)
for c in ['pct_penduduk_miskin','jml_penduduk_miskin','garis_kemiskinan',
          'indeks_kedalaman_p1','indeks_keparahan_p2','ipm_kab']:
    df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
    df[c] = df[c].fillna(df[c].median())
df['depth_severity_ratio'] = df['depth_severity_ratio'].fillna(df['depth_severity_ratio'].median())

X = df[feats].values
y = df['stunting_pct'].values

# Ensemble OOF: 20 seeds, 5 folds each = 100 model fits
SEEDS = list(range(20))
preds_matrix = np.zeros((len(df), len(SEEDS)))

for si, seed in enumerate(SEEDS):
    oof = np.zeros(len(df))
    for tr, te in KFold(n_splits=5, shuffle=True, random_state=seed).split(X):
        m = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                             subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                             random_state=seed, n_jobs=-1).fit(X[tr], y[tr])
        oof[te] = m.predict(X[te])
    preds_matrix[:, si] = oof

# Median ensemble
y_ens = np.median(preds_matrix, axis=1)
mae = mean_absolute_error(y, y_ens)
r2 = r2_score(y, y_ens)
corr = np.corrcoef(y, y_ens)[0,1]
print(f'Ensemble (20 seeds) MAE = {mae:.3f}  R2 = {r2:.3f}  corr = {corr:.3f}')

# Top-15 comparison
top15_pred = np.argsort(-y_ens)[:15]
top15_act  = np.argsort(-y)[:15]
overlap = len(set(top15_pred) & set(top15_act))
print(f'Precision@15 (ensemble): {overlap}/15')

print('\nTop-15 by ensemble prediction:')
for i in top15_pred[:15]:
    hit = '★' if i in top15_act else ' '
    print(f"  {hit} {df.iloc[i]['kabupaten_kota_st']:<25} {df.iloc[i]['provinsi']:<22} pred={y_ens[i]:>5.1f}  actual={y[i]:>5.1f}")

# Save ensemble predictions
df['ens_pred'] = y_ens
df[['domain_id','kabupaten_kota_st','provinsi','stunting_pct','ens_pred']].to_csv(
    DATA_PROC / 'ensemble_predictions.csv', index=False)
print(f'\n✓ saved {DATA_PROC / "ensemble_predictions.csv"}')
