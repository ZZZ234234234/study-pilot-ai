.PHONY: install dev api test lint build format migrate
PYTHON = .venv/bin/python

install:
	python3 -m venv .venv
	$(PYTHON) -m pip install -e 'apps/api[dev]'
	npm install
	$(PYTHON) scripts/create_sample.py

dev:
	$(PYTHON) scripts/dev.py

api:
	$(PYTHON) scripts/dev.py --api-only

test:
	$(PYTHON) -m pytest apps/api/tests
	npm test

lint:
	$(PYTHON) -m ruff check apps/api scripts
	npm run lint
	npm run typecheck

format:
	$(PYTHON) -m ruff format apps/api scripts
	npm run format

build:
	npm run build

migrate:
	$(PYTHON) -m alembic -c apps/api/alembic.ini upgrade head
