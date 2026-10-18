.DEFAULT_GOAL := help
.PHONY: help install test pipeline train serve web-install web-typecheck cf-build cf-deploy

PYTHON ?= python

help:
	@echo "install       Install the Python project and its dependencies"
	@echo "test          Run the Python unit tests"
	@echo "pipeline      Build the merged dataset (requires local source data and BPS_API_KEY)"
	@echo "train         Train the model (requires data/processed/stuntwatch_merged_v3.csv)"
	@echo "serve         Run the local FastAPI backend on port 8000"
	@echo "web-install   Install the Node.js dependencies"
	@echo "web-typecheck Run the frontend TypeScript checks"
	@echo "cf-build      Build the Cloudflare Worker"
	@echo "cf-deploy     Deploy the Cloudflare Worker"

install:
	$(PYTHON) -m pip install -e .

test:
	$(PYTHON) -m unittest discover -s tests -v

pipeline:
	$(PYTHON) -m stuntwatch.data.pipeline

train:
	$(PYTHON) -m stuntwatch.ml.train

serve:
	$(PYTHON) -m uvicorn stuntwatch.api.main:app --host 127.0.0.1 --port 8000 --reload

web-install:
	npm ci

web-typecheck:
	npm run typecheck

cf-build:
	npm run cf:build

cf-deploy:
	npm run cf:deploy
