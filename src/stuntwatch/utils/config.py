from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_RAW = ROOT / 'data' / 'raw'
DATA_PROC = ROOT / 'data' / 'processed'
ARTIFACTS = ROOT / 'models' / 'artifacts'

BPS_CSV = DATA_RAW / 'stuntwatch_bps_kab_v2.csv'
TARGET_CSV = DATA_RAW / 'dataset_risiko_stunting_kabkota.csv'
WASH_LONG = DATA_RAW / 'wash_v2_long.csv'
HDX_DIR = DATA_RAW / 'hdx'
HDX_INPUTS = (
    HDX_DIR / 'idn_adm2_facilities.csv',
    HDX_DIR / 'idn_adm2_demographics.csv',
    HDX_DIR / 'idn_adm2_rural_population.csv',
    HDX_DIR / 'idn_adm2_rai.csv',
)

MERGED_V1 = DATA_PROC / 'stuntwatch_merged.csv'
MERGED_V2 = DATA_PROC / 'stuntwatch_merged_v2.csv'
MERGED_V3 = DATA_PROC / 'stuntwatch_merged_v3.csv'

PREDICTIONS_JSON = ARTIFACTS / 'stuntwatch_predictions_v3.json'

XGB_MODEL = ARTIFACTS / 'xgboost_model.json'
DATASET_XLSX = ROOT / 'docs' / 'StuntWatch_Dataset.xlsx'
