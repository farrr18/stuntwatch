# StuntWatch

**An early-warning and decision-support system for district-level stunting risk in Indonesia.**

StuntWatch combines socioeconomic and public-health data, an XGBoost model, SHAP explanations, and an optional Together AI narrative endpoint. The web dashboard is a Next.js application deployed to Cloudflare Workers. A FastAPI backend is also available for local development.

## Repository layout

- `app/`, `components/`, `lib/`, `messages/`, and `public/` — Next.js dashboard, API routes, translations, and map assets.
- `src/stuntwatch/` — installable Python package, FastAPI service, data pipeline, and model training code.
- `data/raw/` — local source datasets; see [`data/raw/README.md`](./data/raw/README.md).
- `data/processed/` — generated merged datasets (not committed).
- `models/artifacts/` — the prediction JSON used by the web API and model-training outputs.
- `mocks/` — offline fallback snapshots imported by the web API adapter.
- `scripts/` — build-time utilities; `npm run generate-mocks` optionally refreshes the map boundaries and live-data fallbacks.
- `research/` — archived training/analysis scripts and their outputs; not used to serve the website.
- `tests/` — Python unit tests.
- `docs/` — [product requirements](./docs/prd.md), [system design](./docs/design.md), deployment guides, data references, and the generated stakeholder workbook.

## Requirements

- Node.js and npm (use the version specified by the repository's package files).
- Python 3.10 or newer.
- GNU Make is optional; all Python and npm commands below can also be run directly in PowerShell.

## Local setup

From PowerShell at the repository root:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
Copy-Item .env.example .env
npm ci
```

If PowerShell blocks virtual-environment activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` for the current terminal, or call `.\.venv\Scripts\python.exe` directly.

On macOS/Linux, create and activate the environment with `python3 -m venv .venv` and `source .venv/bin/activate`, then run the same pip and npm install commands.

Set `BPS_API_KEY` in `.env` to download the BPS data. Set `TOGETHER_API_KEY` only if you want to use AI-generated narratives. Do not commit `.env` or real credentials.

## Data pipeline and model

The pipeline downloads BPS indicators, joins the target dataset, adds WASH indicators, and merges the included HDX tables:

```powershell
python -m stuntwatch.data.pipeline
python -m stuntwatch.ml.train
```

The BPS API key and local source datasets are prerequisites. `data/raw/README.md` documents the exact input filenames. The target stunting dataset and WASH long-form dataset are not distributed in this repository; obtain them from their documented sources and keep them local. The pipeline checks these prerequisites before making a network request and reports missing files explicitly.

Training is computationally intensive. It performs grouped and random cross-validation plus SHAP analysis, and requires `data/processed/stuntwatch_merged_v3.csv` from the pipeline. It updates the prediction/model artifacts used by the dashboard.

## Run the local FastAPI backend

```powershell
python -m uvicorn stuntwatch.api.main:app --host 127.0.0.1 --port 8000 --reload
```

The API is available at `http://127.0.0.1:8000/api/health`. If port 8000 is already in use, stop the process using it or choose another port with `--port`.

To use the interactive command-line dashboard in a second terminal:

```powershell
stuntwatch
```

## Run the web dashboard

```powershell
npm run dev
```

The dashboard is available at `http://localhost:3000`. To build and deploy it to Cloudflare Workers, follow [`docs/CLOUDFLARE_DEPLOY.md`](./docs/CLOUDFLARE_DEPLOY.md). The web application uses its own Next.js API routes; the local FastAPI server is a separate development interface.

The generated stakeholder workbook is saved as [`docs/StuntWatch_Dataset.xlsx`](./docs/StuntWatch_Dataset.xlsx). BPS source documentation is in [`docs/data-sources.md`](./docs/data-sources.md).

## Checks

```powershell
python -m unittest discover -s tests -v
npm run typecheck
npm run cf:build
```

With GNU Make installed, equivalent targets are available via `make help` (for example, `make test`, `make pipeline`, and `make serve`).

## Model limitations and provenance

- Reported model metrics and limitations are documented in the project materials; predictions are prioritization signals, not diagnoses or substitutes for official surveys.
- Data sources include BPS and HeiGIT HDX. Respect source licensing and usage conditions for any locally supplied datasets.
- Built for the INFEST XII 2026 Hackathon by Tim Siapa Sangka, Universitas Syiah Kuala.
