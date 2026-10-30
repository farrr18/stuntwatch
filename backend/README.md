# StuntWatch backend

The Python package in `src/stuntwatch/` contains the FastAPI development server,
data pipeline, model training, and command-line tools.

## Setup

From the repository root, install the backend package and dependencies:

```powershell
python -m pip install -e ./backend
```

Keep the local `.env` file in the repository root. Add the source datasets to
`data/raw/` as described in [`data/raw/README.md`](./data/raw/README.md).

## Run

```powershell
python -m stuntwatch.data.pipeline
python -m stuntwatch.ml.train
python -m uvicorn stuntwatch.api.main:app --host 127.0.0.1 --port 8000 --reload
```

The pipeline writes precomputed dashboard predictions to `models/artifacts/`.
The frontend's Cloudflare Worker serves that checked-in prediction artifact.
