# QueryFlow ⚡

Ask your database in plain English. Get SQL and beautiful charts instantly.

A full-stack Natural Language to SQL (NL2SQL) SaaS-style application built using Next.js 14, FastAPI, LangChain, OpenAI GPT-4o, and PostgreSQL.

## Features
- **Natural Language Interface**: Connect any PostgreSQL/MySQL DB and converse with your data.
- **Smart Visualizations**: Automatically generates Bar, Line, Pie charts, or KPI cards based on the shape of your query results using Recharts.
- **Safety First**: Powered by `sqlparse`, only read-only `SELECT` queries are executed.
- **Credential Security**: Database credentials are encrypted using AES-256-GCM.
- **Self-Healing SQL**: Automatic error-correction loop passes DB execution errors back to the LLM.
- **Query History**: Save, share, and review past queries and generated SQL.

## Architecture
- **Frontend**: Next.js 14 (App router), React Query, Zustand, TailwindCSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic, slowapi (Rate limiting)
- **AI Core**: LangChain, GPT-4o (or Gemini 1.5 Pro)
- **Storage**: PostgreSQL (for users, active connection configs, and query history)
- **DevOps**: Docker, Docker Compose, GitHub Actions, Nginx

## Quick Setup (Docker)

1. Clone the repo
2. Copy the environment file
```bash
cp .env.example .env
```
3. Edit `.env` and configure your `OPENAI_API_KEY` and other secrets.
4. Run Docker Compose
```bash
docker-compose up --build
```
5. Apply database migrations
```bash
docker-compose exec backend alembic upgrade head
```

The app will be available at `http://localhost`. The FastAPI Swagger docs are at `http://localhost:8000/docs`.
