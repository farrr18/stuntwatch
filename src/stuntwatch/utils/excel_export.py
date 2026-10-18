#!/usr/bin/env python3
"""StuntWatch — build a structured Excel workbook for stakeholder review."""
import json
import pandas as pd
from .config import DATASET_XLSX, MERGED_V3, PREDICTIONS_JSON

MERGED = MERGED_V3
PREDS  = PREDICTIONS_JSON
OUT    = DATASET_XLSX

# ─────────────────────────────────────────────────────────
# Load
# ─────────────────────────────────────────────────────────
df = pd.read_csv(MERGED)
with open(PREDS) as f:
    preds = json.load(f)

# flatten predictions
pred_rows = []
for k in preds['kabupaten']:
    row = {
        'domain_id': k['domain_id'],
        'kabupaten_kota_st': k['kabupaten_kota'],
        'provinsi_st': k['provinsi'],
        'prediction_pct': round(k['prediction'], 2),
        'actual_pct': round(k['actual'], 2),
        'error_pp': round(k['prediction'] - k['actual'], 2),
        'risk_tier_pred': k['risk_tier'],
        'risk_tier_actual': k['actual_tier'],
        'data_confidence': k.get('data_confidence', 'unknown'),
    }
    for i, f in enumerate(k['top_features'][:3], 1):
        row[f'top{i}_feature'] = f['name']
        row[f'top{i}_value']   = round(f['value'], 2) if f['value'] is not None else None
        row[f'top{i}_shap']    = round(f['shap'], 2) if f['shap'] is not None else None
    pred_rows.append(row)
pred_df = pd.DataFrame(pred_rows)

# ─────────────────────────────────────────────────────────
# MASTER — merge raw + predictions
# ─────────────────────────────────────────────────────────
MASTER_COLS = [
    'domain_id', 'kabupaten_kota_st', 'provinsi_st', 'jenis',
    # Poverty
    'pct_penduduk_miskin', 'jml_penduduk_miskin', 'garis_kemiskinan',
    'indeks_kedalaman_p1', 'indeks_keparahan_p2',
    # Education
    'rls_kab', 'hls_kab',
    # Economy
    'pengeluaran_kab', 'ipm_kab',
    # WASH
    'akses_air_minum_layak_prov_pct', 'akses_sanitasi_aman_prov_pct',
    'air_minum_layak_kab', 'sanitasi_layak_kab',
    # Health services
    'pemantauan_pertumbuhan_sesuai_standar_prov_pct',
    'RAI_total_pop', 'RAI_children_u5',
    # Geography
    'rural_pop_perc', 'is_kota',
    # Target + prediction
    'stunting_pct', 'kategori_prevalensi_stunting',
    'prediction_pct', 'error_pp',
    'risk_tier_pred',
    # SHAP top-3
    'top1_feature', 'top1_value', 'top1_shap',
    'top2_feature', 'top2_value', 'top2_shap',
    'top3_feature', 'top3_value', 'top3_shap',
    'data_confidence',
]

# join raw df (has kabupaten_kota_st and provinsi) with pred_df on domain_id
master = df.merge(
    pred_df.drop(columns=[c for c in ['kabupaten_kota_st','provinsi_st','provinsi'] if c in pred_df.columns]),
    on='domain_id', how='left'
)

# rename for display
master = master.rename(columns={
    'kabupaten_kota_st': 'Kabupaten/Kota',
    'kabupaten_kota_bps': 'Kabupaten/Kota (BPS)',
    'kabupaten_kota_bps': 'Kabupaten/Kota (BPS)',
    'provinsi': 'Provinsi',
    'jenis': 'Jenis',
    'pct_penduduk_miskin': 'Penduduk Miskin (%)',
    'jml_penduduk_miskin': 'Jml Penduduk Miskin (ribu)',
    'garis_kemiskinan': 'Garis Kemiskinan (Rp ribu)',
    'indeks_kedalaman_p1': 'Indeks Kedalaman (P1)',
    'indeks_keparahan_p2': 'Indeks Keparahan (P2)',
    'rls_kab': 'Rata-rata Lama Sekolah',
    'hls_kab': 'Harapan Lama Sekolah',
    'pengeluaran_kab': 'Pengeluaran per Kapita (Rp ribu)',
    'ipm_kab': 'IPM',
    'akses_air_minum_layak_prov_pct': 'Akses Air Minum Layak (prov, %)',
    'akses_sanitasi_aman_prov_pct': 'Akses Sanitasi Aman (prov, %)',
    'air_minum_layak_kab': 'Air Minum Layak (kab, %)',
    'sanitasi_layak_kab': 'Sanitasi Layak (kab, %)',
    'pemantauan_pertumbuhan_sesuai_standar_prov_pct': 'Pemantauan Pertumbuhan (prov, %)',
    'RAI_total_pop': 'Rural Access Index',
    'RAI_children_u5': 'RAI Balita',
    'rural_pop_perc': 'Populasi Rural (%)',
    'is_kota': 'Kota (1=ya)',
    'stunting_pct': 'Stunting Aktual (%)',
    'kategori_prevalensi_stunting': 'Kategori Aktual',
    'prediction_pct': 'Prediksi Stunting (%)',
    'error_pp': 'Selisih (pp)',
    'risk_tier_pred': 'Kategori Prediksi',
    'data_confidence': 'Kepercayaan Data',
    'top1_feature': 'Top-1 Faktor',  'top1_value': 'Top-1 Nilai', 'top1_shap': 'Top-1 SHAP',
    'top2_feature': 'Top-2 Faktor',  'top2_value': 'Top-2 Nilai', 'top2_shap': 'Top-2 SHAP',
    'top3_feature': 'Top-3 Faktor',  'top3_value': 'Top-3 Nilai', 'top3_shap': 'Top-3 SHAP',
})
master = master[[c for c in master.columns if not c.startswith('Unnamed') and c in master.columns]]

# keep only renamed columns in display order
DISPLAY_ORDER = [
    'domain_id', 'Kabupaten/Kota', 'Provinsi', 'Jenis',
    'Penduduk Miskin (%)', 'Jml Penduduk Miskin (ribu)', 'Garis Kemiskinan (Rp ribu)',
    'Indeks Kedalaman (P1)', 'Indeks Keparahan (P2)',
    'Rata-rata Lama Sekolah', 'Harapan Lama Sekolah',
    'Pengeluaran per Kapita (Rp ribu)', 'IPM',
    'Akses Air Minum Layak (prov, %)', 'Akses Sanitasi Aman (prov, %)',
    'Air Minum Layak (kab, %)', 'Sanitasi Layak (kab, %)',
    'Pemantauan Pertumbuhan (prov, %)', 'Rural Access Index', 'RAI Balita',
    'Populasi Rural (%)', 'Kota (1=ya)',
    'Stunting Aktual (%)', 'Kategori Aktual',
    'Prediksi Stunting (%)', 'Selisih (pp)', 'Kategori Prediksi',
    'Top-1 Faktor', 'Top-1 Nilai', 'Top-1 SHAP',
    'Top-2 Faktor', 'Top-2 Nilai', 'Top-2 SHAP',
    'Top-3 Faktor', 'Top-3 Nilai', 'Top-3 SHAP',
    'Kepercayaan Data',
]
master = master[[c for c in DISPLAY_ORDER if c in master.columns]]
master = master.sort_values('Prediksi Stunting (%)', ascending=False).reset_index(drop=True)
master.index += 1

# ─────────────────────────────────────────────────────────
# PROVINCE SUMMARY
# ─────────────────────────────────────────────────────────
prov = master.groupby('Provinsi').agg(
    n_kabupaten=('Kabupaten/Kota', 'count'),
    avg_aktual=('Stunting Aktual (%)', 'mean'),
    avg_prediksi=('Prediksi Stunting (%)', 'mean'),
    min_prediksi=('Prediksi Stunting (%)', 'min'),
    max_prediksi=('Prediksi Stunting (%)', 'max'),
    kab_tertinggi=('Prediksi Stunting (%)', 'idxmax'),
).round(2).sort_values('avg_prediksi', ascending=False).reset_index()
prov['kab_tertinggi'] = prov['kab_tertinggi'].apply(lambda i: master.loc[i, 'Kabupaten/Kota'] if pd.notna(i) else None)
prov = prov.rename(columns={
    'Provinsi': 'Provinsi',
    'n_kabupaten': 'Jumlah Kabupaten/Kota',
    'avg_aktual': 'Rata-rata Aktual (%)',
    'avg_prediksi': 'Rata-rata Prediksi (%)',
    'min_prediksi': 'Min Prediksi (%)',
    'max_prediksi': 'Max Prediksi (%)',
    'kab_tertinggi': 'Kabupaten Tertinggi',
})
prov.index += 1

# ─────────────────────────────────────────────────────────
# README sheet
# ─────────────────────────────────────────────────────────
readme = pd.DataFrame({
    'Item': [
        'Nama Dataset', 'Versi', 'Tanggal Dibuat',
        'Coverage', 'Cakupan', 'Jumlah Fitur',
        'Model', 'Target Variable', 'Sumber Target',
        'Sumber Fitur 1', 'Sumber Fitur 2', 'Sumber Fitur 3', 'Sumber Fitur 4',
        'Metrik GroupKFold R²', 'Metrik GroupKFold MAE', 'Metrik LOPO R²',
        'Catatan',
    ],
    'Keterangan': [
        'StuntWatch — Stunting Risk Dataset Indonesia',
        'v3 (2024 feature set)',
        pd.Timestamp.now().strftime('%Y-%m-%d %H:%M'),
        '514 kabupaten/kota',
        'Seluruh Indonesia (38 provinsi)',
        '20 fitur model + turunan',
        'XGBoost (regression + multiclass) + SHAP explainability',
        'stunting_pct (prevalensi stunting, %)',
        'GitHub: Mikasmng/Pemetaan-Stunting-Indonesia (kumpulan estimasi berbasis SSGI/SKI 2021–2023)',
        'BPS WebAPI — Susenas & Podes (poverty, IPM, pendidikan, pengeluaran)',
        'BPS WebAPI — WASH (air minum, sanitasi) tingkat kabupaten & provinsi',
        'HeiGIT HDX — Rural Access Index & populasi rural',
        'Kemenkes Profil Kesehatan — pemantauan pertumbuhan (provinsi proxy)',
        f'{preds["metrics_groupkfold"]["reg_r2"]:.3f}',
        f'{preds["metrics_groupkfold"]["reg_mae"]:.2f} pp',
        f'{preds["metrics_lopo"]["reg_r2"]:.3f} (batasan: fitur provinsi-proxy tidak generalisasi ke provinsi baru)',
        'Data mentah dapat direproduksi ulang via Makefile. Angka prediksi ≠ diagnosis; sistem ini alat bantu prioritas, bukan pengganti survei.',
    ]
})

# ─────────────────────────────────────────────────────────
# Write Excel
# ─────────────────────────────────────────────────────────
with pd.ExcelWriter(OUT, engine='xlsxwriter') as xw:
    # README
    readme.to_excel(xw, sheet_name='README', index=False)

    # Master
    master.to_excel(xw, sheet_name='Master', index=True, index_label='No')

    # Province Summary
    prov.to_excel(xw, sheet_name='Ringkasan Provinsi', index=True, index_label='No')

    # Top 50 / Bottom 50
    master.head(50).to_excel(xw, sheet_name='Top 50 Risiko Tinggi', index=True, index_label='No')
    master.tail(50).iloc[::-1].to_excel(xw, sheet_name='Top 50 Risiko Rendah', index=True, index_label='No')

    # Formatting
    wb = xw.book
    header_fmt = wb.add_format({'bold': True, 'bg_color': '#1F4E78', 'font_color': 'white',
                                'align': 'center', 'valign': 'vcenter', 'border': 1, 'text_wrap': True})
    num_fmt = wb.add_format({'num_format': '#,##0.00'})

    for sheet_name in ['Master', 'Ringkasan Provinsi', 'Top 50 Risiko Tinggi', 'Top 50 Risiko Rendah']:
        ws = xw.sheets[sheet_name]
        for col_idx, col_name in enumerate(
            (readme if sheet_name == 'README' else
             (master if sheet_name.startswith('Master') else
              (prov if sheet_name == 'Ringkasan Provinsi' else master))).columns
        ):
            ws.write(0, col_idx, col_name, header_fmt)
            ws.set_column(col_idx, col_idx, max(12, min(35, len(str(col_name)) + 4)))
        ws.freeze_panes(1, 0)

print(f'✓ Wrote {OUT}')
print(f'  Master: {len(master)} rows × {len(master.columns)} columns')
print(f'  Province summary: {len(prov)} rows')
print(f'  Top 50 + Bottom 50 ranked lists')
print(f'  README with sources and metrics')
