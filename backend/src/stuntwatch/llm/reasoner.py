import os
from together import Together

_client = None
SKIP_FEATURES = {"implied_pop", "dependency_ratio_rural", "is_kota", "depth_severity_ratio", "RAI_children_u5", "RAI_total_pop", "garis_kemiskinan"}

def _get_client():
    global _client
    if _client is None:
        # Together SDK handles the correct base URL automatically
        _client = Together(api_key=os.environ.get("TOGETHER_API_KEY", ""))
    return _client

PROMPT = """Anda adalah analis kebijakan kesehatan untuk pemerintah daerah Indonesia.

PROFIL RISIKO STUNTING:
- Kabupaten/Kota: {kab} ({prov})
- Skor risiko prediksi: {pred:.1f}% (kategori: {tier})
- Tingkat kepercayaan data: {data_conf}

FAKTOR DOMINAN (SHAP):
{shap_lines}

Tulis 3 paragraf dalam Bahasa Indonesia, total <180 kata:
1. PROFIL: Ringkas kondisi risiko daerah ini berdasarkan faktor dominan di atas.
2. INTERPRETASI: Jelaskan mengapa faktor tersebut berkaitan dengan risiko stunting.
3. REKOMENDASI: Berikan 2 intervensi prioritas yang konkret.

Batasan: JANGAN menyatakan hubungan sebab-akibat. Jangan sebut "SHAP" atau "AI"."""

def generate_narrative(kab_row):
    top = [f for f in kab_row["top_features"] if f["name"] not in SKIP_FEATURES][:5]
    lines = []
    for f in top:
        if f.get("shap") is None: continue
        direction = "menaikkan risiko" if f["shap"] > 0 else "menurunkan risiko"
        lines.append(f"  - {f['name']}: nilai={f['value']} ({direction})")

    prompt = PROMPT.format(
        kab=kab_row["kabupaten_kota"], prov=kab_row["provinsi"],
        pred=kab_row["prediction"], tier=kab_row["risk_tier"],
        data_conf=kab_row.get("data_confidence", "unknown"),
        shap_lines="\n".join(lines)
    )

    # Official model string MUST include -Turbo [citation:9][citation:14]
    r = _get_client().chat.completions.create(
        model="meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3, max_tokens=400
    )
    return r.choices[0].message.content
