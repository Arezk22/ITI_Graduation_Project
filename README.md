# BuildTender 🏗️

**AI-Powered Construction Tender Management Platform** — ITI Graduation Project

BuildTender connects construction **project owners** with **contractors**. Owners publish tenders with their specification documents and Bill of Quantities (BOQ), contractors submit technical and financial proposals, and an AI pipeline evaluates every submission end-to-end — scoring, comparing, and recommending the best bid.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [The AI Layer](#the-ai-layer)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Team](#team)

---

## Key Features

### Platform

- **Role-based access** — three user roles built on a custom Django user model:
  - **Owner**: creates tenders, uploads specification documents, defines evaluation rules, reviews AI analysis, compares submissions, and awards the project.
  - **Contractor**: browses open tenders, chats with tender documents, submits technical/financial proposals, and tracks awarded projects.
  - **Admin**: manages the platform through the Django admin.
- **Tender lifecycle management** — create tenders with budgets, deadlines, attached files (specs, BOQ, drawings), and custom weighted evaluation rules.
- **Proposal submission** — contractors upload their technical and financial offers as documents; file types are detected and routed automatically.
- **Awarding workflow** — owners award tenders to a chosen contractor directly from the comparison view.
- **Printable evaluation reports** — evaluation results are rendered as professional reports and exported to PDF from the browser.
- **Notifications & dashboards** — dedicated dashboards for owners and contractors.

### AI

- **Multi-agent proposal evaluation** (LangGraph) — validates, risk-scores, technically and financially evaluates, compares, and ranks all submissions, then recommends a winner.
- **Intelligent document processing** — extracts native *and scanned* Arabic/English construction PDFs using text extraction and vision-based OCR, with extraction-quality analysis and a human-review fallback for low-confidence documents.
- **RAG document chat** — contractors ask questions about a tender and get answers grounded in the tender's actual documents, with conversation memory per chat.

---

## System Architecture

```
┌─────────────────────┐        REST (JWT)         ┌──────────────────────────┐
│  React SPA (Vite)   │ ◄───────────────────────► │   Django + DRF Backend   │
│  Owner / Contractor │                           │  account · api · ai_...  │
└─────────────────────┘                           └────────────┬─────────────┘
                                                               │ signals on file upload /
                                                               │ evaluation request
                                                  ┌────────────▼─────────────┐
                                                  │   Celery Workers (Redis) │
                                                  │  indexing & evaluation   │
                                                  └────────────┬─────────────┘
                              ┌────────────────────────────────┼───────────────────────────┐
                              ▼                                ▼                           ▼
                   ┌───────────────────┐            ┌─────────────────────┐     ┌────────────────────┐
                   │ Document Intake   │            │ LangGraph Multi-    │     │ PostgreSQL +       │
                   │ (pdfplumber +     │            │ Agent Evaluation    │     │ pgvector store     │
                   │  Gemini vision)   │            │ Workflow            │     │ (RAG embeddings)   │
                   └───────────────────┘            └─────────────────────┘     └────────────────────┘
```

**Flow:**

1. An owner creates a tender and uploads its documents; a contractor submits a proposal with its files.
2. A `post_save` signal fires a **Celery task** that runs the document intake pipeline: files are classified, extracted (text or vision OCR), cleaned, chunked, embedded, and stored in **pgvector** — making them instantly available to the RAG chat.
3. When the owner requests an evaluation, the **LangGraph workflow** pulls the structured tender requirements and every submission, runs them through the agent chain, and persists scores, risks, comparisons, and a final recommendation to the database.
4. The React frontend visualizes the analysis (AI Analysis, Evaluation, and Compare Submissions pages) and generates printable reports.

---

## The AI Layer

### 1. Multi-Agent Evaluation Workflow (`ai_pipeline/agents/`)

A LangGraph state machine where each node is a specialized agent:

| Agent | Responsibility |
|---|---|
| **Validation agent** | Checks each submission against the tender's mandatory requirements |
| **Risk agent** | Detects and grades risk items in each proposal |
| **Technical agent** | Scores the technical offer against the tender's technical criteria |
| **Financial agent** | Scores the financial offer (pricing, BOQ analysis) |
| **Scoring agent** | Combines scores using the tender's weighted evaluation rules |
| **Comparison agent** | Compares all submissions side by side |
| **Recommendation agent** | Produces the final award recommendation with justification |
| **Persistence node** | Saves all results back to the relational models |

Agents exchange a shared typed state (`TenderState`) and produce structured output validated by **Pydantic** models.

### 2. Document Intake & OCR (`ai_pipeline/extractors/`)

- Detects file type and routes each document to the right extractor.
- Native PDFs → text and table extraction with **pdfplumber**.
- Scanned PDFs → page images sent to **Gemini vision** acting as an OCR engine specialized in construction documents, returning text, tables, confidence scores, and unclear sections.
- Extraction quality is analyzed; low-confidence files are flagged for **human review** instead of silently entering the pipeline.
- Raw extractions are normalized into unified Pydantic schemas (`UnifiedStructuredTender`, `UnifiedStructuredProposal`, BOQ items, evaluation rules).

### 3. RAG Chat (`ai_pipeline/services/`)

- Documents are chunked with `RecursiveCharacterTextSplitter` (1000 chars, 150 overlap), embedded with **OpenAI embeddings**, and stored in **PGVector** with rich metadata (tender, file, category, page).
- `RagAgent` retrieves the top-k relevant chunks per question and builds a grounded prompt.
- `ChatService` + `ChatMemoryService` manage per-user, per-tender chat sessions with conversation history.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python, Django 5, Django REST Framework, SimpleJWT (auth), drf-spectacular (OpenAPI docs), django-cors-headers |
| **AI / LLM** | LangChain, LangGraph, Google Gemini (vision OCR), OpenAI-compatible LLMs via OpenRouter, OpenAI embeddings, Pydantic |
| **Data** | PostgreSQL + pgvector (production), SQLite (fallback for local dev) |
| **Async** | Celery + Redis (document indexing, evaluation jobs, email) |
| **Document processing** | pdfplumber, pdf2image, pypdf, Pillow |
| **Frontend** | React 19, Vite, React Router 7, Axios, Bootstrap 5, react-to-print |
| **Testing** | Vitest + React Testing Library (frontend), Django test framework (backend) |

---

## Project Structure

```
├── config/            # Django project settings, root urls, celery app
├── account/           # Custom user model (owner/contractor/admin), JWT auth, contractor profiles
├── api/               # Core domain: tenders, files, submissions, evaluation rules,
│                      # BOQ items, risk items, human review, awarding, signals
├── ai_pipeline/       # The AI layer
│   ├── agents/        #   LangGraph evaluation workflow, agent prompts, shared state
│   ├── extractors/    #   Document intake, PDF/vision OCR extraction, quality analysis
│   ├── services/      #   RAG agent, chat service, chat memory
│   ├── vector_store.py#   Chunking, embedding, PGVector persistence
│   ├── main_pipeline.py#  Orchestration entry points (evaluation job, RAG indexing)
│   └── tasks.py       #   Celery tasks
├── frontend/          # React SPA
│   └── src/
│       ├── pages/     #   Owner & contractor dashboards, tender details, proposals,
│       │              #   AI analysis, evaluation, compare, document chat, reports
│       ├── components/
│       ├── services/  #   Axios API clients
│       └── test/
└── media/             # Uploaded tender & submission files
```

---

## API Overview

Interactive documentation is available once the server is running:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`

### Main endpoints (`/api/v1/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `register/`, `login/`, `refresh/` | JWT registration, login, token refresh |
| `GET/POST` | `tenders` | List open tenders / create a tender (owner, multipart with files + evaluation rules) |
| `GET/PATCH/DELETE` | `tenders/<id>` | Tender detail & management |
| `GET/POST` | `tenders/<id>/files` | Tender documents |
| `GET/POST` | `tenders/<id>/evaluation-rules` | Weighted evaluation criteria |
| `GET/POST` | `tenders/<id>/submissions` | Contractor proposals for a tender |
| `POST` | `tenders/<id>/award/<contractor_id>` | Award the tender (owner only) |
| `GET` | `submissions/my` | Contractor's own submissions |
| `POST` | `tenders/<id>/evaluate` | Trigger the AI multi-agent evaluation |
| `CRUD` | `chats/` | RAG document-chat sessions |
| `GET/PUT` | `contractor/` | Contractor profile |

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL with the [pgvector](https://github.com/pgvector/pgvector) extension
- Redis (Celery broker)
- Poppler (required by `pdf2image` for scanned-PDF processing)

### 1. Backend

```bash
# clone and enter the project
git clone <repo-url> && cd ITI_Graduation_Project

# create a virtualenv and install dependencies
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirments.txt

# configure environment
cp example.env .env             # then fill in the values (see below)

# create the database and enable pgvector
# (in psql): CREATE DATABASE buildtender_db; CREATE EXTENSION vector;

# migrate and run
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 2. Celery worker

Redis must be running, then in a separate terminal:

```bash
celery -A config worker -l info
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

```bash
npm test             # run the frontend test suite (Vitest)
```

---

## Environment Variables

Create a `.env` file in the project root (see `example.env`):

| Variable | Description |
|---|---|
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | PostgreSQL connection (falls back to SQLite if unset) |
| `GEMINI_API_KEY` | Google Gemini key — vision OCR for scanned documents |
| `OPENROUTER_API_KEY` | Key for the OpenAI-compatible LLM used by the agents |
| `OPENAI_API_BASE` | Base URL of the OpenAI-compatible endpoint (e.g. OpenRouter) |
| `MODEL` | Model ID used by the text/vision LLMs |
| `OPENAI_API_KEY` | OpenAI key used for RAG embeddings |

---

## Team

Developed as a graduation project for the **Information Technology Institute (ITI)**.

<!-- Add teammate names, instructor, and demo links here -->
