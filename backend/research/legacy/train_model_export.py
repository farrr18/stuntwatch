import pandas as pd
import numpy as np
import json
import xgboost as xgb
import shap
from sklearn.model_selection import GroupKFold
from sklearn.preprocessing import LabelEncoder
from stuntwatch.utils.config import MERGED_V3, PREDICTIONS_JSON, XGB_MODEL

def train_model():
    print("Loading data...")
    df = pd.read_csv(MERGED_V3)
    
    # Define Features
    base = ['pct_penduduk_miskin','jml_penduduk_miskin','garis_kemiskinan',
            'indeks_kedalaman_p1','indeks_keparahan_p2','ipm_kab',
            'akses_air_minum_layak_prov_pct','akses_sanitasi_aman_prov_pct',
            'pemantauan_pertumbuhan_sesuai_standar_prov_pct']
    derived = ['depth_severity_ratio','implied_pop','is_kota']
    v2_dense = ['rls_kab','hls_kab','pengeluaran_kab']
    v2_wash = ['air_minum_layak_kab','sanitasi_layak_kab']
    hdx = ['rural_pop_perc','RAI_total_pop','RAI_children_u5']
    feats = base + derived + v2_dense + v2_wash + hdx

    # Calculate derived features
    df['depth_severity_ratio'] = df['indeks_kedalaman_p1']/df['indeks_keparahan_p2'].replace(0,np.nan)
    df['implied_pop'] = df['jml_penduduk_miskin']/df['pct_penduduk_miskin'].replace(0,np.nan)*100
    df['is_kota'] = (df['jenis']=='kota').astype(int)
    for c in base[:-3]:
        df[c] = df.groupby('provinsi')[c].transform(lambda s: s.fillna(s.median()))
        df[c] = df[c].fillna(df[c].median())
    df['depth_severity_ratio'] = df['depth_severity_ratio'].fillna(df['depth_severity_ratio'].median())

    df = df.dropna(subset=['stunting_pct']).reset_index(drop=True)
    X, y = df[feats].values, df['stunting_pct'].values
    le = LabelEncoder()
    y_cls = le.fit_transform(df['kategori_prevalensi_stunting'])
    groups = df['provinsi'].values

    print(f"Training XGBoost on {len(df)} districts...")
    # Train final model on all data
    model = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                             subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                             random_state=42, n_jobs=-1).fit(X, y)
    
    model.save_model(XGB_MODEL)
    print(f"✓ Saved model to {XGB_MODEL}")

    print("Calculating SHAP values...")
    explainer = shap.TreeExplainer(model)
    shap_vals = explainer.shap_values(X)
    
    print("Generating OOF predictions...")
    oof_preds = np.zeros(len(df))
    for tr, te in GroupKFold(n_splits=5).split(X, y, groups):
        m = xgb.XGBRegressor(n_estimators=600, max_depth=4, learning_rate=0.04,
                             subsample=0.85, colsample_bytree=0.85, reg_lambda=1.5,
                             random_state=42, n_jobs=-1).fit(X[tr], y[tr])
        oof_preds[te] = m.predict(X[te])

    print("Exporting predictions JSON...")
    payload = {'features': feats, 'classes': list(le.classes_), 'kabupaten': []}
    
    def risk_tier(p):
        if p < 20: return 'Rendah'
        if p < 30: return 'Sedang'
        if p < 40: return 'Tinggi'
        return 'Sangat Tinggi'

    for i, row in df.iterrows():
        sv = shap_vals[i]
        order = np.argsort(-np.abs(sv))[:8]
        payload['kabupaten'].append({
            'kabupaten_kota': row['kabupaten_kota_st'],
            'provinsi': row['provinsi'],
            'domain_id': int(row['domain_id']),
            'prediction': float(oof_preds[i]),
            'actual': float(row['stunting_pct']),
            'risk_tier': risk_tier(float(oof_preds[i])),
            'actual_tier': row['kategori_prevalensi_stunting'],
            'data_confidence': 'proxy' if pd.isna(row['sanitasi_layak_kab']) else 'local',
            'top_features': [{'name': feats[j], 'value': float(row[feats[j]]) if pd.notna(row[feats[j]]) else None, 'shap': float(sv[j])} for j in order]
        })
        
    with open(PREDICTIONS_JSON, 'w') as f:
        json.dump(payload, f, indent=2)
    print(f"✓ Saved dashboard JSON to {PREDICTIONS_JSON}")

if __name__ == "__main__":
    train_model()
