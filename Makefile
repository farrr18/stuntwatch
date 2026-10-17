.PHONY: install pipeline train serve clean

install:
	python3 -m venv venv
	./venv/bin/pip install -r requirements.txt

pipeline:
	PYTHONPATH=src ./venv/bin/python -m stuntwatch.data.pipeline

train:
	PYTHONPATH=src ./venv/bin/python -m stuntwatch.models.train

serve:
	PYTHONPATH=src ./venv/bin/uvicorn stuntwatch.api.main:app --host 0.0.0.0 --port 8000 --reload

clean:
	rm -rf data/processed/*.csv
	rm -rf models/artifacts/*.json
