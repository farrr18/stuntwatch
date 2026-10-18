import json
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from ..utils.config import PREDICTIONS_JSON as PREDICTIONS

app = FastAPI(title="StuntWatch API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

with open(PREDICTIONS) as f:
    DATA = json.load(f)

BY_DOMAIN = {k["domain_id"]: k for k in DATA["kabupaten"]}
PROVINCES = sorted({k["provinsi"] for k in DATA["kabupaten"]})

def _slug(name: str) -> str:
    """Normalize province name for URL use: 'Nusa Tenggara Timur' -> 'nusa-tenggara-timur'"""
    return name.lower().replace(" ", "-").replace("di ", "di-")

PROV_BY_SLUG = {_slug(p): p for p in PROVINCES}
PROV_BY_LOWER = {p.lower(): p for p in PROVINCES}

def _resolve_province(name: str) -> Optional[str]:
    """Accept 'Aceh', 'aceh', 'nusa-tenggara-timur', 'NUSA TENGGARA TIMUR'."""
    if name in PROV_BY_LOWER: return PROV_BY_LOWER[name]
    if name in PROV_BY_SLUG:  return PROV_BY_SLUG[name]
    # try slug of the literal input
    s = name.lower().replace(" ", "-")
    return PROV_BY_SLUG.get(s)

# ─────────────────────────────────────────────────────────
# National endpoints
# ─────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "regions": len(DATA["kabupaten"]), "provinces": len(PROVINCES)}

@app.get("/api/metrics")
def metrics():
    return {"groupkfold": DATA.get("metrics_groupkfold"),
            "lopo": DATA.get("metrics_lopo")}

@app.get("/api/provinces")
def provinces():
    """List all 38 provinces with summary stats."""
    out = []
    for p in PROVINCES:
        rows = [k for k in DATA["kabupaten"] if k["provinsi"] == p]
        preds = [r["prediction"] for r in rows]
        acts  = [r["actual"] for r in rows]
        out.append({
            "province": p,
            "slug": _slug(p),
            "n_kabupaten": len(rows),
            "avg_predicted": round(sum(preds)/len(preds), 2),
            "avg_actual":    round(sum(acts)/len(acts), 2),
            "max_predicted": round(max(preds), 2),
            "highest_risk_kabupaten": max(rows, key=lambda r: r["prediction"])["kabupaten_kota"],
            "tier_counts": {
                t: sum(1 for r in rows if r["risk_tier"] == t)
                for t in ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"]
            },
        })
    return sorted(out, key=lambda x: -x["avg_predicted"])

@app.get("/api/kabupaten")
def list_kab(provinsi: Optional[str] = Query(None)):
    """All kabupaten, optionally filtered by province."""
    rows = DATA["kabupaten"]
    if provinsi:
        resolved = _resolve_province(provinsi)
        if not resolved:
            raise HTTPException(404, f"Province '{provinsi}' not found")
        rows = [k for k in rows if k["provinsi"] == resolved]
    return [{"domain_id": k["domain_id"], "kabupaten_kota": k["kabupaten_kota"],
             "provinsi": k["provinsi"], "prediction": k["prediction"],
             "actual": k["actual"], "risk_tier": k["risk_tier"],
             "data_confidence": k.get("data_confidence")}
            for k in rows]

@app.get("/api/kabupaten/{domain_id}")
def one_kab(domain_id: int):
    k = BY_DOMAIN.get(domain_id)
    if not k: raise HTTPException(404)
    return k

# ─────────────────────────────────────────────────────────
# Province-scoped endpoints (the "StuntWatch Aceh" feature)
# ─────────────────────────────────────────────────────────
@app.get("/api/provinsi/{provinsi}")
def by_prov(provinsi: str):
    """Get all kabupaten in a province, sorted by predicted risk desc."""
    resolved = _resolve_province(provinsi)
    if not resolved:
        raise HTTPException(404, f"Province '{provinsi}' not found. Available: {', '.join(PROVINCES)}")
    rows = [k for k in DATA["kabupaten"] if k["provinsi"] == resolved]
    rows = sorted(rows, key=lambda r: -r["prediction"])
    return {
        "province": resolved,
        "slug": _slug(resolved),
        "n_kabupaten": len(rows),
        "avg_predicted": round(sum(r["prediction"] for r in rows)/len(rows), 2),
        "avg_actual":    round(sum(r["actual"] for r in rows)/len(rows), 2),
        "kabupaten": [
            {"domain_id": k["domain_id"], "kabupaten_kota": k["kabupaten_kota"],
             "prediction": round(k["prediction"], 2),
             "actual": round(k["actual"], 2),
             "error": round(k["prediction"] - k["actual"], 2),
             "risk_tier": k["risk_tier"],
             "actual_tier": k["actual_tier"],
             "top_feature": k["top_features"][0]["name"] if k["top_features"] else None,
             "top_feature_shap": round(k["top_features"][0]["shap"], 2) if k["top_features"] else None}
            for k in rows
        ],
    }

@app.get("/api/provinsi/{provinsi}/summary")
def prov_summary(provinsi: str):
    """Compact summary + metrics for one province, for a scoped dashboard view."""
    resolved = _resolve_province(provinsi)
    if not resolved:
        raise HTTPException(404, f"Province '{provinsi}' not found")
    rows = [k for k in DATA["kabupaten"] if k["provinsi"] == resolved]
    preds = [r["prediction"] for r in rows]
    acts  = [r["actual"] for r in rows]
    errors = [abs(p - a) for p, a in zip(preds, acts)]
    tier_counts = {t: sum(1 for r in rows if r["risk_tier"] == t)
                   for t in ["Rendah", "Sedang", "Tinggi", "Sangat Tinggi"]}
    return {
        "province": resolved,
        "slug": _slug(resolved),
        "n_kabupaten": len(rows),
        "avg_predicted": round(sum(preds)/len(preds), 2),
        "avg_actual":    round(sum(acts)/len(acts), 2),
        "min_predicted": round(min(preds), 2),
        "max_predicted": round(max(preds), 2),
        "mae_in_province": round(sum(errors)/len(errors), 2),
        "tier_counts": tier_counts,
        "highest_risk":  max(rows, key=lambda r: r["prediction"])["kabupaten_kota"],
        "lowest_risk":   min(rows, key=lambda r: r["prediction"])["kabupaten_kota"],
    }

# ─────────────────────────────────────────────────────────
# LLM narrative (per kabupaten)
# ─────────────────────────────────────────────────────────
@app.get("/api/kabupaten/{domain_id}/narrative")
def narrative(domain_id: int):
    k = BY_DOMAIN.get(domain_id)
    if not k: raise HTTPException(404)
    try:
        from ..llm.reasoner import generate_narrative
        return {"domain_id": domain_id, "narrative": generate_narrative(k)}
    except Exception as e:
        raise HTTPException(500, f"LLM error: {e}")


@app.get("/api/map-data")
def get_map_data():
    """
    Returns map data grouped by BPS code (domain_id).
    Format: { "1101": {"tier": "Sedang", "color": "#eab308", "pred": 25.1}, ... }
    """
    map_payload = {}
    for k in DATA["kabupaten"]:
        map_payload[str(k["domain_id"])] = {
            "kabupaten": k["kabupaten_kota"],
            "provinsi": k["provinsi"],
            "pred": round(k["prediction"], 1),
            "actual": round(k["actual"], 1),
            "tier": k["risk_tier"],
            "color": _get_map_color(k["risk_tier"])
        }
    return map_payload

def _get_map_color(tier):
    if tier == "Sangat Tinggi": return "#ef4444" # Red
    if tier == "Tinggi": return "#f97316"        # Orange
    if tier == "Sedang": return "#eab308"        # Yellow
    return "#22c55e"                             # Green (Rendah)
