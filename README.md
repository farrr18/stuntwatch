# StuntWatch 🇮🇩
**AI-Based Early Warning System for Stunting Risk in 514 Indonesian Districts**

StuntWatch is an end-to-end machine learning pipeline and decision-support system designed to predict stunting risk at the district (kabupaten/kota) level. It uses publicly available socioeconomic data to forecast risk before official surveys are published, explains the root causes using SHAP, and generates localized policy briefs using an LLM.

## 📖 The Problem
Indonesia's official stunting survey (SSGI) takes **~17 months** from preparation to publication. By the time the data reaches local governments, the children measured are already toddlers. Stunting is irreversible after the first 1,000 days of life. Local governments are left allocating billions of Rupiah in intervention budgets blindly.

## 💡 The Solution
StuntWatch provides an **11-month head start** by using BPS socioeconomic data (which publishes much faster) to predict the upcoming survey results.

1. **Predict:** XGBoost regression model forecasts stunting prevalence for all 514 districts.
2. **Explain:** SHAP identifies exactly *why* a district is at risk (e.g., water access vs. maternal education).
3. **Act:** An LLM (Llama 3.3 70B) translates the SHAP values into a localized, plain-Indonesian policy brief for local health officials.

## 🏗️ Architecture & Tech Stack
*   **Data Pipeline:** Python, Pandas (Entity resolution, BPS WebAPI, HDX spatial merging).
*   **Machine Learning:** XGBoost (20 features).
*   **Explainability:** SHAP (TreeExplainer).
*   **LLM Reasoning:** Together AI (Llama 3.3 70B Instruct).
*   **Backend API:** Cloudflare Worker routes served by Next.js; the FastAPI server remains available for local development.
*   **Frontend:** Next.js, React, and Leaflet.
*   **Deployment:** Cloudflare Workers via OpenNext.

## 🚀 Quick Start
### 1. Installation
git clone https://github.com/your-username/stuntwatch.git
cd stuntwatch
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

### 2. Environment Variables
Create a `.env` file:
TOGETHER_API_KEY="your_together_api_key_here"

### 3. Run the Pipeline & Train the Model
make pipeline
make train

### 4. Start the API
make serve
API available at `http://localhost:8000`.

### Deploy the web application to Cloudflare

The Cloudflare Worker serves both the frontend and dashboard API from the checked-in prediction artifact. Run the Python pipeline separately to refresh predictions before deployment. See [docs/CLOUDFLARE_DEPLOY.md](./docs/CLOUDFLARE_DEPLOY.md) for preview, deployment, and Together AI secret setup.

## 📊 Model Performance & Limitations
*   **Error Reduction:** Reduces MAE by **24.8%** vs a national-mean baseline (6.33 pp -> 4.76 pp).
*   **Tier Agreement:** Correctly flags **12 out of 15** of Indonesia's worst-stunting districts.
*   **Honest Limitation:** Cannot reliably rank districts *within* a single province due to missing WASH data (Spearman ~0.11). Functions as a province-level priority signal.

## 🛡️ License & Acknowledgements
*   Data sourced from BPS, Kemenkes, and HeiGIT HDX.
*   Built for the INFEST XII 2026 Hackathon.
*   Team: Tim Siapa Sangka (Universitas Syiah Kuala).
