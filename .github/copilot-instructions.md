# Copilot instructions for this repository

This file orients Copilot sessions to the repo's build/test commands, high-level architecture, and repository-specific conventions.

---
Quick commands (use project root)

- Install dependencies (project uses a misspelled requirements file):
  - python -m pip install -r requirments.txt

- Migrate DB (dev):
  - python manage.py migrate

- Create superuser:
  - python manage.py createsuperuser

- Run development server:
  - python manage.py runserver

- Run all tests (Django TestCase):
  - python manage.py test

- Run a single test or test case (examples):
  - python manage.py test api.tests.TestCaseClassName.test_method_name
  - python manage.py test api.tests (run only the api app tests)

Notes about linting/formatters
- There is no repository lint/formatter config (no pyproject.toml, .flake8, or pre-commit config found). Copilot should not assume a specific linter is configured.

---
High-level architecture (big picture)

- Django monolith whose settings module is config.settings (DJANGO_SETTINGS_MODULE set in manage.py).
- Apps of interest:
  - account: custom user model (AUTH_USER_MODEL = "account.Users") and ContractorProfiles.
  - api: domain models for Tenders, TenderSubmissions, files, BOQ items, RiskItem, HumanReview.
  - ai_agent: simple chat session/message models storing conversation history per tender/user.
  - ai_pipeline: document ingestion, text splitting, vector-store integration, and evaluation workflow.

- Data stores:
  - Default development DB: SQLite (db.sqlite3) as configured in config/settings.py.
  - Production/embedding store: code uses PostgreSQL + pgvector via ai_pipeline/vector_store.py and expects a PostgreSQL connection string when saving/searching vectors.

- AI & embeddings:
  - ai_pipeline/main_pipeline.py coordinates document extraction, chunking, embeddings and a LangGraph evaluation workflow.
  - ai_pipeline/vector_store.py uses OpenAIEmbeddings (text-embedding-3-small) and PGVector; save_documents_to_db writes metadata keys `tender_id` and `source_id` and stores vectors in a collection named `tender_{tender_id}`.
  - Environment variables read from a .env at repository root (config/settings.py uses python-dotenv). Relevant env keys seen in code: OPENAI_API_KEY, OPENAI_API_BASE, and DB connection strings for PGVector.

---
Key repository conventions and notable patterns

- Custom user model: account.Users (AUTH_USER_MODEL). Code and migrations reference settings.AUTH_USER_MODEL.
- Vector-store metadata: when saving RAG docs, functions inject `tender_id` and `source_id` into document.metadata — use these keys to filter RAG queries.
- Vector collections are created per-tender with the name format: `tender_{tender_id}`.
- AI pipeline functions are invoked programmatically (no CLI wrapper). Look at ai_pipeline/main_pipeline.py for the orchestrator function run_tender_evaluation_job(...).
- Manage.py sets default settings module to config.settings; Copilot prompts should reference that path for any settings edits.
- Requirements filename is `requirments.txt` (typo) — use that exact filename when installing dependencies or referencing the file.

---
Where Copilot should look first (important files)

- Entry & settings: manage.py, config/settings.py
- Domain models & API: api/models.py, api/views.py, api/urls.py
- Auth: account/models.py
- AI orchestration: ai_pipeline/main_pipeline.py, ai_pipeline/vector_store.py
- Chat models: ai_agent/models.py

---
If editing code that touches embeddings or vector storage

- Ensure PGVector code paths (ai_pipeline/vector_store.py) receive a proper PostgreSQL connection string and that pgvector is installed on the DB.
- Keep metadata keys (`tender_id`, `source_id`) intact to preserve filtering logic.

---
If tests are added or CI is requested

- Tests are currently Django TestCase files (api/tests.py, account/tests.py, ai_pipeline/tests.py) and are empty stubs. Use python manage.py test <label> to run specific tests.

---
What this file does NOT cover

- No assumptions about linters, formatters, or CI workflows are made because none were found in the repo.

---
If changes are made to project layout

- Update the settings module path, AUTH_USER_MODEL references, and ai_pipeline vector-store connection guidance above.

