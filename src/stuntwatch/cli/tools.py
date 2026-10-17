"""StuntWatch — quick data inspection. Run from repo root."""
import json, sys
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
ARTIFACTS = ROOT / 'models' / 'artifacts'
DATA = ROOT / 'data' / 'processed'

# ─────────────────────────────────────────────────────────
# Load once
# ─────────────────────────────────────────────────────────
def load_predictions():
    with open(ARTIFACTS / 'stuntwatch_predictions_v3.json') as f:
        return json.load(f)

def predictions_df():
    """Flatten JSON into one row per kabupaten + the top-3 SHAP features as columns."""
    d = load_predictions()
    rows = []
    for k in d['kabupaten']:
        row = {
            'domain_id': k['domain_id'],
            'kabupaten': k['kabupaten_kota'],
            'provinsi': k['provinsi'],
            'pred_pct': round(k['prediction'], 1),
            'actual_pct': round(k['actual'], 1),
            'error': round(k['prediction'] - k['actual'], 1),
            'tier': k['risk_tier'],
            'actual_tier': k['actual_tier'],
            'data_conf': k.get('data_confidence', '?'),
        }
        # top-3 SHAP features as columns
        for i, f in enumerate(k['top_features'][:3], 1):
            row[f'f{i}_name'] = f['name'].replace('_', ' ')
            row[f'f{i}_shap'] = round(f['shap'], 2) if f['shap'] is not None else None
        rows.append(row)
    return pd.DataFrame(rows)

def merged_df():
    return pd.read_csv(DATA / 'stuntwatch_merged_v3.csv')


# ─────────────────────────────────────────────────────────
# Pretty printers
# ─────────────────────────────────────────────────────────
def show_metrics():
    d = load_predictions()
    g, l = d['metrics_groupkfold'], d['metrics_lopo']
    print('\n┌─ MODEL METRICS ────────────────────────────────────┐')
    print(f'│ {"metric":<22}{"GroupKFold":>12}{"LOPO":>12} │')
    print(f'│ {"─"*20:<22}{"─"*10:>12}{"─"*10:>12} │')
    for k, label in [('reg_mae','MAE (pp)'), ('reg_r2','R²'), ('cls_acc','Accuracy'), ('cls_f1','F1 macro')]:
        print(f'│ {label:<22}{g[k]:>12.3f}{l[k]:>12.3f} │')
    print('└────────────────────────────────────────────────────┘\n')

def top_n_risky(n=10):
    df = predictions_df().sort_values('pred_pct', ascending=False).head(n)
    print(f'\n═══ TOP {n} HIGHEST PREDICTED RISK ═══\n')
    print(df[['kabupaten','provinsi','pred_pct','actual_pct','tier','f1_name','f1_shap']].to_string(index=False))

def top_n_safe(n=10):
    df = predictions_df().sort_values('pred_pct').head(n)
    print(f'\n═══ TOP {n} LOWEST PREDICTED RISK ═══\n')
    print(df[['kabupaten','provinsi','pred_pct','actual_pct','tier','f1_name','f1_shap']].to_string(index=False))

def by_province(prov=None):
    df = predictions_df()
    if prov:
        df = df[df['provinsi'].str.lower() == prov.lower()]
        print(f'\n═══ {prov.upper()} ({len(df)} kabupaten) ═══\n')
        print(df[['kabupaten','pred_pct','actual_pct','error','tier']].to_string(index=False))
    else:
        summary = df.groupby('provinsi').agg(
            n=('kabupaten','count'),
            avg_pred=('pred_pct','mean'),
            avg_actual=('actual_pct','mean'),
            max_pred=('pred_pct','max'),
        ).round(1).sort_values('avg_pred', ascending=False)
        print('\n═══ ALL PROVINCES — sorted by avg predicted risk ═══\n')
        print(summary.to_string())

def worst_predictions(n=15):
    df = predictions_df()
    df['abs_err'] = df['error'].abs()
    print(f'\n═══ {n} WORST PREDICTIONS (|pred - actual|) ═══\n')
    print(df.nlargest(n, 'abs_err')[['kabupaten','provinsi','pred_pct','actual_pct','error','tier','actual_tier']].to_string(index=False))

def feature_importance(n=20):
    d = load_predictions()
    # mean |SHAP| from all top_features entries
    from collections import defaultdict
    agg = defaultdict(list)
    for k in d['kabupaten']:
        for f in k['top_features']:
            if f['shap'] is not None:
                agg[f['name']].append(abs(f['shap']))
    import numpy as np
    rows = [(name, np.mean(v), len(v)) for name, v in agg.items()]
    df = pd.DataFrame(rows, columns=['feature','mean_abs_shap','appears_in_top8']).sort_values('mean_abs_shap', ascending=False).head(n)
    print(f'\n═══ TOP {n} FEATURES (mean |SHAP| across all regions) ═══\n')
    print(df.to_string(index=False))

def describe_one(domain_id):
    d = load_predictions()
    k = next((x for x in d['kabupaten'] if x['domain_id'] == domain_id), None)
    if not k:
        print(f'domain_id {domain_id} not found'); return
    print(f'\n═══ {k["kabupaten_kota"]} ({k["provinsi"]}) — domain {domain_id} ═══\n')
    print(f'  Prediction:      {k["prediction"]:.1f}%  ({k["risk_tier"]})')
    print(f'  Actual:          {k["actual"]:.1f}%  ({k["actual_tier"]})')
    print(f'  Data confidence: {k.get("data_confidence")}')
    print(f'\n  Top SHAP contributors:')
    for f in k['top_features']:
        if f['shap'] is None: continue
        arrow = '↑' if f['shap'] > 0 else '↓'
        print(f'    {arrow} {f["name"]:<45} value={str(f["value"]):>10}  shap={f["shap"]:+.3f}')


# ─────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'help'
    arg = sys.argv[2] if len(sys.argv) > 2 else None
    cmds = {
        'metrics':    show_metrics,
        'risky':      lambda: top_n_risky(int(arg) if arg else 10),
        'safe':       lambda: top_n_safe(int(arg) if arg else 10),
        'provinces':  by_province,
        'province':   lambda: by_province(arg),
        'worst':      lambda: worst_predictions(int(arg) if arg else 15),
        'features':   lambda: feature_importance(int(arg) if arg else 20),
        'show':       lambda: describe_one(int(arg)),
    }
    if cmd in cmds:
        cmds[cmd]()
    else:
        print("""Usage:
  python tools.py metrics            # GroupKFold vs LOPO metrics
  python tools.py risky [n]          # top-n highest predicted risk
  python tools.py safe [n]           # top-n lowest predicted risk
  python tools.py provinces          # all provinces ranked
  python tools.py province Papua     # one province's kabupaten
  python tools.py worst [n]          # n largest prediction errors
  python tools.py features [n]       # top-n features by mean |SHAP|
  python tools.py show 1101          # full detail for one kabupaten
""")
