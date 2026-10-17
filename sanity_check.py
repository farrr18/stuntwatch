#!/usr/bin/env python3
"""StuntWatch — end-to-end sanity check before D-day."""
import json, sys
from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parent
PASS, FAIL, WARN = "✓", "✗", "⚠"

def check(cond, msg, warn_only=False):
    icon = PASS if cond else (WARN if warn_only else FAIL)
    print(f"  {icon} {msg}")
    return cond

print("\n" + "═" * 70)
print("  STUNTWATCH SANITY CHECK")
print("═" * 70)

# ─── 1. Files exist ───
print("\n[1] File presence")
files = {
    'data/raw/stuntwatch_bps_kab_v2.csv': 'BPS raw',
    'data/raw/dataset_risiko_stunting_kabkota.csv': 'Target CSV',
    'data/raw/wash_v2_long.csv': 'WASH long',
    'data/raw/hdx/idn_adm2_facilities.csv': 'HDX facilities',
    'data/raw/hdx/idn_adm2_rural_population.csv': 'HDX rural',
    'data/raw/hdx/idn_adm2_demographics.csv': 'HDX demographics',
    'data/raw/hdx/idn_adm2_rai.csv': 'HDX RAI',
    'data/processed/stuntwatch_merged_v3.csv': 'Merged v3',
    'models/artifacts/stuntwatch_predictions_v3.json': 'Predictions JSON',
    'models/train_v3.py': 'Training script',
    'backend/main.py': 'FastAPI app',
    'tools.py': 'CLI inspector',
    'province.py': 'Province report',
    'make_excel.py': 'Excel generator',
}
all_present = True
for path, label in files.items():
    exists = (ROOT / path).exists()
    if not exists: all_present = False
    check(exists, f"{label:<30} {path}")

# ─── 2. Dataset integrity ───
print("\n[2] Dataset integrity (merged_v3)")
df = pd.read_csv(ROOT / 'data/processed/stuntwatch_merged_v3.csv')
check(len(df) == 514, f"Row count = 514 (actual: {len(df)})")
check(df['domain_id'].nunique() == 514, f"domain_id unique = 514 (actual: {df['domain_id'].nunique()})")
check(df['provinsi'].nunique() == 38, f"Provinces = 38 (actual: {df['provinsi'].nunique()})")
check(df['stunting_pct'].notna().all(), f"All stunting_pct filled (missing: {df['stunting_pct'].isna().sum()})")
check(df['kategori_prevalensi_stunting'].notna().all(), "All tier labels filled")
check(df['stunting_pct'].between(0, 100).all(), f"stunting_pct in [0,100] (range: {df['stunting_pct'].min():.1f}–{df['stunting_pct'].max():.1f})")

# ─── 3. Feature coverage ───
print("\n[3] Feature coverage")
feats = {
    'pct_penduduk_miskin': 'Poverty %',
    'jml_penduduk_miskin': 'Poverty count',
    'garis_kemiskinan': 'Poverty line',
    'indeks_kedalaman_p1': 'Poverty depth',
    'indeks_keparahan_p2': 'Poverty severity',
    'ipm_kab': 'HDI',
    'akses_air_minum_layak_prov_pct': 'Water access (prov)',
    'akses_sanitasi_aman_prov_pct': 'Sanitation (prov)',
    'pemantauan_pertumbuhan_sesuai_standar_prov_pct': 'Growth monitoring',
    'rls_kab': 'Years schooling',
    'hls_kab': 'Expected schooling',
    'pengeluaran_kab': 'Expenditure',
    'air_minum_layak_kab': 'Water access (kab)',
    'sanitasi_layak_kab': 'Sanitation (kab)',
    'rural_pop_perc': 'Rural population',
    'RAI_total_pop': 'Rural Access Index',
    'RAI_children_u5': 'RAI under-5',
}
for col, label in feats.items():
    if col not in df.columns:
        check(False, f"{label:<30} MISSING COLUMN")
        continue
    n = df[col].notna().sum()
    pct = n / len(df) * 100
    icon = PASS if pct >= 90 else (WARN if pct >= 50 else WARN)
    print(f"  {icon} {label:<30} {n:>3}/514  ({pct:.0f}%)")

# ─── 4. Predictions JSON ───
print("\n[4] Predictions JSON")
with open(ROOT / 'models/artifacts/stuntwatch_predictions_v3.json') as f:
    preds = json.load(f)
check(len(preds['kabupaten']) == 514, f"514 kabupaten entries (actual: {len(preds['kabupaten'])})")
check('metrics_groupkfold' in preds, "GroupKFold metrics present")
check('metrics_lopo' in preds, "LOPO metrics present")
check('features' in preds, f"Feature list present ({len(preds.get('features', []))} features)")

# verify structure of first entry
k0 = preds['kabupaten'][0]
required_keys = ['kabupaten_kota', 'provinsi', 'domain_id', 'prediction', 'actual',
                 'risk_tier', 'actual_tier', 'top_features', 'data_confidence']
for key in required_keys:
    check(key in k0, f"Entry has '{key}' key")

# check domain_id join integrity
pred_ids = {k['domain_id'] for k in preds['kabupaten']}
df_ids = set(df['domain_id'])
missing = df_ids - pred_ids
extra = pred_ids - df_ids
check(len(missing) == 0, f"No missing domain_ids (missing: {len(missing)})")
check(len(extra) == 0, f"No extra domain_ids (extra: {len(extra)})")

# ─── 5. Predictions sanity ───
print("\n[5] Predictions sanity")
pred_vals = [k['prediction'] for k in preds['kabupaten']]
act_vals  = [k['actual'] for k in preds['kabupaten']]
mae = np.mean(np.abs(np.array(pred_vals) - np.array(act_vals)))
corr = np.corrcoef(pred_vals, act_vals)[0,1]
check(4 < mae < 7, f"MAE in [4, 7] pp (actual: {mae:.2f}pp)")
check(0.4 < corr < 0.85, f"Correlation in [0.4, 0.85] (actual: {corr:.3f})")
check(min(pred_vals) > 0, f"Min prediction > 0 (actual: {min(pred_vals):.1f})")
check(max(pred_vals) < 70, f"Max prediction < 70 (actual: {max(pred_vals):.1f})")

# ─── 6. SHAP integrity ───
print("\n[6] SHAP integrity")
shap_ok = 0
for k in preds['kabupaten'][:50]:  # check first 50
    if k.get('top_features') and len(k['top_features']) == 8:
        if all('shap' in f and f['shap'] is not None for f in k['top_features']):
            shap_ok += 1
check(shap_ok == 50, f"First 50 entries have 8 complete SHAP features ({shap_ok}/50)")

# ─── 7. Tier distribution ───
print("\n[7] Risk tier distribution")
tiers = pd.Series([k['risk_tier'] for k in preds['kabupaten']]).value_counts()
for t in ['Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi']:
    n = tiers.get(t, 0)
    check(n > 0, f"{t:<15} {n:>3} regions")
total = tiers.sum()
check(total == 514, f"Total {total} = 514")

# ─── 8. Model metrics ───
print("\n[8] Model metrics")
gkf = preds['metrics_groupkfold']
lopo = preds['metrics_lopo']
check(0.2 < gkf['reg_r2'] < 0.4, f"GroupKFold R² in [0.2, 0.4] (actual: {gkf['reg_r2']:.3f})")
check(4 < gkf['reg_mae'] < 6.5, f"GroupKFold MAE in [4, 6.5] (actual: {gkf['reg_mae']:.2f})")
check(lopo['reg_r2'] < 0, f"LOPO R² negative (actual: {lopo['reg_r2']:.3f})")

# ─── 9. Backend imports ───
print("\n[9] Backend imports")
sys.path.insert(0, str(ROOT / 'pipeline'))
sys.path.insert(0, str(ROOT / 'backend'))
try:
    import fastapi, uvicorn
    check(True, "FastAPI + uvicorn importable")
except ImportError as e:
    check(False, f"FastAPI import failed: {e}")
try:
    import xgboost, shap
    check(True, "XGBoost + SHAP importable")
except ImportError as e:
    check(False, f"XGBoost/SHAP import failed: {e}")
try:
    from _paths import PREDICTIONS, MERGED_V3
    check(True, f"_paths module works (PREDICTIONS: {PREDICTIONS.name})")
except Exception as e:
    check(False, f"_paths import failed: {e}")

# ─── 10. Top-15 highest risk (visual sanity) ───
print("\n[10] Top-15 highest risk (for pitch sanity)")
top = sorted(preds['kabupaten'], key=lambda k: -k['prediction'])[:15]
for k in top:
    print(f"  {k['kabupaten_kota']:<30} {k['provinsi']:<25} pred={k['prediction']:>5.1f}  actual={k['actual']:>5.1f}  {k['risk_tier']}")

# ─── Summary ───
print("\n" + "═" * 70)
print("  SANITY CHECK COMPLETE")
print("═" * 70)
