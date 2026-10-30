import pandas as pd, numpy as np, json
import xgboost as xgb
import shap
from sklearn.model_selection import GroupKFold, LeaveOneGroupOut, KFold
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder
from stuntwatch.utils.config import MERGED_V3, PREDICTIONS_JSON

df = pd.read_csv(MERGED_V3)

base = ['pct_penduduk_miskin','jml_penduduk_miskin','garis_kemiskinan',
        'indeks_kedalaman_p1','indeks_keparahan_p2','ipm_kab',
        'akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
        'pemantauan_pertumbuhan_sesuai_standar_prov_pct']
derived = ['depth_severity_ratio','implied_pop','is_kota']
v2_dense = ['rls_kab','hls_kab','pengeluaran_kab']
v2_wash  = ['air_minum_layak_kab','sanitasi_layak_kab']
hdx = ['rural_pop_perc','RAI_total_pop','RAI_children_u5']

feats = base + derived + v2_dense + v2_wash + hdx

# ---- impute province-level constants only; leave rest NaN for XGBoost ----
for c in ['akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
          'pemantauan_pertumbuhan_sesuai_standar_prov_pct']:
    df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
    df[c] = df[c].fillna(df[c].median())

# kab-level base + derived
df['depth_severity_ratio'] = df['indeks_kedalaman_p1']/df['indeks_keparahan_p2'].replace(0,np.nan)
df['implied_pop'] = df['jml_penduduk_miskin']/df['pct_penduduk_miskin'].replace(0,np.nan)*100
df['is_kota'] = (df['jenis']=='kota').astype(int)
for c in ['pct_penduduk_miskin','jml_penduduk_miskin','garis_kemiskinan',
          'indeks_kedalaman_p1','indeks_keparahan_p2','ipm_kab']:
    df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
    df[c] = df[c].fillna(df[c].median())
df['depth_severity_ratio'] = df['depth_severity_ratio'].fillna(df['depth_severity_ratio'].median())

df = df.dropna(subset=['stunting_pct','kategori_prevalensi_stunting']).reset_index(drop=True)
print(f'rows: {len(df)}  |  n_feats: {len(feats)}')

X, y_reg, groups = df[feats].values, df['stunting_pct'].values, df['provinsi'].values
le = LabelEncoder(); y_cls = le.fit_transform(df['kategori_prevalensi_stunting'])

def cv(splitter, label):
    mae, r2, acc, f1 = [], [], [], []
    folds = list(splitter.split(X, y_reg, groups))
    for i, (tr, te) in enumerate(folds, 1):
        print(f'  [{label}] fold {i}/{len(folds)}', flush=True)
        reg = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                               subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                               random_state=42, n_jobs=-1).fit(X[tr], y_reg[tr])
        p = reg.predict(X[te])
        mae.append(mean_absolute_error(y_reg[te], p)); r2.append(r2_score(y_reg[te], p))

        cls = xgb.XGBClassifier(n_estimators=600, max_depth=4, learning_rate=0.04,
                                subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                                random_state=42, n_jobs=-1,
                                objective='multi:softprob', num_class=len(le.classes_)).fit(X[tr], y_cls[tr])
        pc = cls.predict(X[te])
        acc.append(accuracy_score(y_cls[te], pc)); f1.append(f1_score(y_cls[te], pc, average='macro'))
    return dict(reg_mae=float(np.mean(mae)), reg_r2=float(np.mean(r2)),
                cls_acc=float(np.mean(acc)), cls_f1=float(np.mean(f1)))

m_gkf  = cv(GroupKFold(n_splits=5),  'GroupKFold')
m_logo = cv(LeaveOneGroupOut(),      'LOPO')

# KFold: plain random split (no grouping) — deployment-realistic
# Same code path as cv() but without groups
def cv_kfold():
    mae, r2, acc, f1 = [], [], [], []
    folds = list(KFold(n_splits=5, shuffle=True, random_state=42).split(X))
    for i, (tr, te) in enumerate(folds, 1):
        print(f'  [KFold] fold {i}/{len(folds)}', flush=True)
        reg = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                               subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                               random_state=42, n_jobs=-1).fit(X[tr], y_reg[tr])
        p = reg.predict(X[te])
        mae.append(mean_absolute_error(y_reg[te], p)); r2.append(r2_score(y_reg[te], p))
        cls = xgb.XGBClassifier(n_estimators=600, max_depth=4, learning_rate=0.04,
                                subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                                random_state=42, n_jobs=-1,
                                objective='multi:softprob', num_class=len(le.classes_)).fit(X[tr], y_cls[tr])
        pc = cls.predict(X[te])
        acc.append(accuracy_score(y_cls[te], pc)); f1.append(f1_score(y_cls[te], pc, average='macro'))
    return dict(reg_mae=float(np.mean(mae)), reg_r2=float(np.mean(r2)),
                cls_acc=float(np.mean(acc)), cls_f1=float(np.mean(f1)))

m_kf = cv_kfold()
print(f'\nGroupKFold  MAE={m_gkf["reg_mae"]:.3f}  R2={m_gkf["reg_r2"]:.3f}  Acc={m_gkf["cls_acc"]:.3f}  F1m={m_gkf["cls_f1"]:.3f}')
print(f'LOPO        MAE={m_logo["reg_mae"]:.3f}  R2={m_logo["reg_r2"]:.3f}  Acc={m_logo["cls_acc"]:.3f}  F1m={m_logo["cls_f1"]:.3f}')
print(f'KFold       MAE={m_kf["reg_mae"]:.3f}  R2={m_kf["reg_r2"]:.3f}  Acc={m_kf["cls_acc"]:.3f}  F1m={m_kf["cls_f1"]:.3f}')

# ---- final full-data model (for SHAP + deployment) ----
reg_full = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                            subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                            random_state=42, n_jobs=-1).fit(X, y_reg)
explainer = shap.TreeExplainer(reg_full)
shap_vals = explainer.shap_values(X)

# ---- OUT-OF-FOLD predictions for honest reporting ----
# Each row's prediction comes from a model that never saw that row during training.
oof_preds = np.zeros(len(df))
for tr, te in KFold(n_splits=5, shuffle=True, random_state=42).split(X):
    m = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                         subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                         random_state=42, n_jobs=-1).fit(X[tr], y_reg[tr])
    oof_preds[te] = m.predict(X[te])
preds = oof_preds

def risk_tier(p):
    if p < 20: return 'Rendah'
    if p < 30: return 'Sedang'
    if p < 40: return 'Tinggi'
    return 'Sangat Tinggi'

def data_conf(row):
    have = [row[c] for c in v2_dense + v2_wash if pd.notna(row[c])]
    if len(have) == len(v2_dense) + len(v2_wash): return 'local'
    if len(have) >= 3: return 'partial'
    return 'proxy'

payload = {
    'features': feats,
    'classes': list(le.classes_),
    'metrics_groupkfold': m_gkf,
    'metrics_lopo': m_logo,
    'metrics_kfold': m_kf,
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
        'data_confidence': data_conf(row),
        'top_features': [{'name': feats[j], 'value': float(row[feats[j]]) if pd.notna(row[feats[j]]) else None,
                          'shap': float(sv[j])} for j in order],
    })

PREDICTIONS_JSON.parent.mkdir(parents=True, exist_ok=True)
with open(PREDICTIONS_JSON, 'w') as f:
    json.dump(payload, f, indent=2)
print('\nsaved stuntwatch_predictions_v3.json —', len(payload['kabupaten']), 'kabupaten')

imp = np.abs(shap_vals).mean(axis=0)
print('\nTop 15 features by mean |SHAP|:')
for j in np.argsort(-imp)[:15]:
    print(f'  {feats[j]:<42} {imp[j]:.3f}')
