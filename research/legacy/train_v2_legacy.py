import pandas as pd, numpy as np, json
import xgboost as xgb
import shap
from sklearn.model_selection import GroupKFold, KFold
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder

df = pd.read_csv('stuntwatch_merged.csv')

base_feats = [
    'pct_penduduk_miskin', 'jml_penduduk_miskin', 'garis_kemiskinan',
    'indeks_kedalaman_p1', 'indeks_keparahan_p2', 'ipm_kab',
    'akses_air_minum_layak_prov_pct', 'akses_sanitasi_aman_prov_pct',
    'pemantauan_pertumbuhan_sesuai_standar_prov_pct',
]

# --- impute: provinsi median -> global median for everything ---
for c in base_feats:
    df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
    df[c] = df[c].fillna(df[c].median())

print('NaNs after impute:', df[base_feats].isna().sum().sum())

# --- derived features ---
df['log_jml_miskin'] = np.log1p(df['jml_penduduk_miskin'])
df['log_garis']      = np.log1p(df['garis_kemiskinan'])
df['depth_severity_ratio'] = df['indeks_kedalaman_p1'] / df['indeks_keparahan_p2'].replace(0, np.nan)
df['implied_pop']    = df['jml_penduduk_miskin'] / df['pct_penduduk_miskin'].replace(0, np.nan) * 100
df['ipm_sq']         = df['ipm_kab'] ** 2
df['pov_x_ipm']      = df['pct_penduduk_miskin'] * df['ipm_kab']
df['is_kota']        = (df['jenis'] == 'kota').astype(int)

# province aggregates (context signal)
for c in ['pct_penduduk_miskin','ipm_kab','indeks_kedalaman_p1']:
    df[f'prov_mean_{c}'] = df.groupby('provinsi')[c].transform('mean')
    df[f'prov_std_{c}']  = df.groupby('provinsi')[c].transform('std').fillna(0)

# within-province rank (0-1) of poverty
df['pov_rank_in_prov'] = df.groupby('provinsi')['pct_penduduk_miskin'].rank(pct=True)

# region dummy
REGION = {
    'Aceh':'Sumatra','Sumatera Utara':'Sumatra','Sumatera Barat':'Sumatra','Riau':'Sumatra',
    'Kepulauan Riau':'Sumatra','Jambi':'Sumatra','Bengkulu':'Sumatra','Sumatera Selatan':'Sumatra',
    'Kepulauan Bangka Belitung':'Sumatra','Lampung':'Sumatra',
    'DKI Jakarta':'Java','Jawa Barat':'Java','Jawa Tengah':'Java','DI Yogyakarta':'Java','Jawa Timur':'Java','Banten':'Java',
    'Bali':'Bali-Nusa','Nusa Tenggara Barat':'Bali-Nusa','Nusa Tenggara Timur':'Bali-Nusa',
    'Kalimantan Barat':'Kalimantan','Kalimantan Tengah':'Kalimantan','Kalimantan Selatan':'Kalimantan',
    'Kalimantan Timur':'Kalimantan','Kalimantan Utara':'Kalimantan',
    'Sulawesi Utara':'Sulawesi','Gorontalo':'Sulawesi','Sulawesi Tengah':'Sulawesi','Sulawesi Barat':'Sulawesi',
    'Sulawesi Selatan':'Sulawesi','Sulawesi Tenggara':'Sulawesi',
    'Maluku':'Maluku-Papua','Maluku Utara':'Maluku-Papua','Papua':'Maluku-Papua',
    'Papua Barat':'Maluku-Papua','Papua Selatan':'Maluku-Papua','Papua Tengah':'Maluku-Papua',
    'Papua Pegunungan':'Maluku-Papua','Papua Barat Daya':'Maluku-Papua',
}
df['region'] = df['provinsi'].map(REGION).fillna('Other')
region_dummies = pd.get_dummies(df['region'], prefix='reg').astype(int)
df = pd.concat([df, region_dummies], axis=1)
region_feats = region_dummies.columns.tolist()

derived_feats = ['log_jml_miskin','log_garis','depth_severity_ratio','implied_pop',
                 'ipm_sq','pov_x_ipm','is_kota','pov_rank_in_prov',
                 'prov_mean_pct_penduduk_miskin','prov_std_pct_penduduk_miskin',
                 'prov_mean_ipm_kab','prov_std_ipm_kab',
                 'prov_mean_indeks_kedalaman_p1','prov_std_indeks_kedalaman_p1']

feats = base_feats + derived_feats + region_feats
# drop any remaining all-nan derived
feats = [f for f in feats if not df[f].isna().all()]
for f in feats:
    df[f] = df[f].fillna(df[f].median())

df = df.dropna(subset=feats + ['stunting_pct','kategori_prevalensi_stunting']).reset_index(drop=True)
print(f'rows: {len(df)}  |  n_feats: {len(feats)}')

X = df[feats].values
y_reg = df['stunting_pct'].values
le = LabelEncoder(); y_cls = le.fit_transform(df['kategori_prevalensi_stunting'])
groups = df['provinsi'].values

def run_cv(splitter, name):
    reg_mae, reg_r2, cls_acc, cls_f1 = [], [], [], []
    for tr, te in splitter.split(X, y_reg, groups):
        m = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                             subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                             random_state=42, n_jobs=-1).fit(X[tr], y_reg[tr])
        p = m.predict(X[te])
        reg_mae.append(mean_absolute_error(y_reg[te], p))
        reg_r2.append(r2_score(y_reg[te], p))

        c = xgb.XGBClassifier(n_estimators=600, max_depth=4, learning_rate=0.04,
                              subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                              random_state=42, n_jobs=-1,
                              objective='multi:softprob', num_class=len(le.classes_)).fit(X[tr], y_cls[tr])
        pc = c.predict(X[te])
        cls_acc.append(accuracy_score(y_cls[te], pc))
        cls_f1.append(f1_score(y_cls[te], pc, average='macro'))
    print(f'\n=== {name} ===')
    print(f'REG MAE = {np.mean(reg_mae):.3f} ± {np.std(reg_mae):.3f}')
    print(f'REG R2  = {np.mean(reg_r2):.3f} ± {np.std(reg_r2):.3f}')
    print(f'CLS Acc = {np.mean(cls_acc):.3f} ± {np.std(cls_acc):.3f}')
    print(f'CLS F1m = {np.mean(cls_f1):.3f} ± {np.std(cls_f1):.3f}')
    return np.mean(reg_mae), np.mean(reg_r2), np.mean(cls_acc), np.mean(cls_f1)

gkf = GroupKFold(n_splits=5)
kf  = KFold(n_splits=5, shuffle=True, random_state=42)
m_g = run_cv(gkf, 'GroupKFold by provinsi (honest, no leakage)')
m_k = run_cv(kf,  'KFold random (province proxies leak across folds)')

# --- final model + SHAP on full data ---
reg_full = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                            subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                            random_state=42, n_jobs=-1).fit(X, y_reg)
explainer = shap.TreeExplainer(reg_full)
shap_vals = explainer.shap_values(X)

def risk_tier(p):
    if p < 20: return 'Rendah'
    if p < 30: return 'Sedang'
    if p < 40: return 'Tinggi'
    return 'Sangat Tinggi'

preds = reg_full.predict(X)
payload = {
    'features': feats,
    'classes': list(le.classes_),
    'metrics_groupkfold': {'reg_mae': float(m_g[0]),'reg_r2': float(m_g[1]),'cls_acc': float(m_g[2]),'cls_f1': float(m_g[3])},
    'metrics_kfold':      {'reg_mae': float(m_k[0]),'reg_r2': float(m_k[1]),'cls_acc': float(m_k[2]),'cls_f1': float(m_k[3])},
    'kabupaten': []
}
for i, row in df.iterrows():
    sv = shap_vals[i]
    order = np.argsort(-np.abs(sv))[:8]
    payload['kabupaten'].append({
        'kabupaten_kota': row['kabupaten_kota_st'],
        'provinsi': row['provinsi'],
        'domain_id': int(row['domain_id']),
        'prediction': float(preds[i]),
        'actual': float(row['stunting_pct']),
        'risk_tier': risk_tier(float(preds[i])),
        'actual_tier': row['kategori_prevalensi_stunting'],
        'top_features': [{'name': feats[j], 'value': float(row[feats[j]]), 'shap': float(sv[j])} for j in order],
    })

with open('stuntwatch_predictions.json','w') as f:
    json.dump(payload, f, indent=2)
print('\nsaved stuntwatch_predictions.json —', len(payload['kabupaten']), 'kabupaten')

# global SHAP importance
imp = np.abs(shap_vals).mean(axis=0)
order = np.argsort(-imp)
print('\nTop 15 features by mean |SHAP|:')
for j in order[:15]:
    print(f'  {feats[j]:<42} {imp[j]:.3f}')
