import pandas as pd, numpy as np, json
from scipy.stats import spearmanr
from stuntwatch.utils.config import DATA_PROC, ROOT

# ---- EDIT THESE after checking the columns ----
ACTUAL = "stunting_pct"
PRED   = "ens_pred"
PROV   = "provinsi"
NAME   = "kabupaten_kota_st"
FILE   = DATA_PROC / "ensemble_predictions.csv"
RESULTS = ROOT / "research" / "results"
# ------------------------------------------------

d = pd.read_csv(FILE).dropna(subset=[ACTUAL, PRED, PROV]).reset_index(drop=True)
y, p = d[ACTUAL].values, d[PRED].values

# province mean, leave-one-out so a district never sees its own value
g = d.groupby(PROV)[ACTUAL]
n, s = g.transform("count"), g.transform("sum")
d["prov_loo"] = np.where(n > 1, (s - d[ACTUAL]) / (n - 1).clip(lower=1), d[ACTUAL].mean())

def report(label, pred, k=15):
    top_true = set(np.argsort(-y)[:k]); top_pred = set(np.argsort(-pred)[:k])
    print(f"{label:22s} MAE={np.mean(np.abs(y-pred)):.2f}  "
          f"Spearman={spearmanr(y,pred)[0]:.3f}  top{k} hit={len(top_true & top_pred)}/{k}")

report("model (ensemble OOF)", p)
report("province mean (LOO)", d["prov_loo"].values)
report("national mean", np.full(len(d), y.mean()))

# residuals: where reality is worse than conditions explain
d["residual"] = d[ACTUAL] - d[PRED]
worse = d.sort_values("residual", ascending=False).head(15)
print("\nTop 15 worse-than-expected:")
print(worse[[NAME, PROV, PRED, ACTUAL, "residual"]].round(1).to_string(index=False))

RESULTS.mkdir(parents=True, exist_ok=True)
d.to_csv(RESULTS / "with_residuals.csv", index=False)
worse.to_json(RESULTS / "worse_than_expected_top15.json", orient="records", indent=2)
print(f"\nsaved analysis results to: {RESULTS}")
