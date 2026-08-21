# PLANNORA

> AI-powered study planner — plan smarter, learn better.

## Overview

PLANNORA is a collaborative team project that helps students organize their study sessions using AI-driven planning, document analysis, quiz generation, and performance analytics.

## Team

| Member | Responsibility |
|--------|---------------|
| Member 1 | Frontend (React + TypeScript + Vite) |
| Member 2 | Backend (FastAPI) |
| Member 3 | AI / RAG |
| Member 4 | Database (PostgreSQL) |
| Member 5 | DevOps, QA, CI/CD, Integration |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | FastAPI (planned) |
| Database | PostgreSQL (planned) |
| AI/RAG | OpenAI + vector search (planned) |
| CI/CD | GitHub Actions |
| Containerization | Docker (planned) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Git](https://git-scm.com/)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Environment Variables

Copy the template and fill in your values:

```bash
cp .env.example .env
```

See [`.env.example`](.env.example) for all available variables.

## Project Structure

```
plannora/
├── .github/workflows/   # CI/CD pipelines
├── frontend/            # React + TypeScript + Vite
├── .env.example         # Environment variable template
├── .gitignore           # Root gitignore
└── README.md            # This file
```

> Additional directories (`backend/`, `database/`, `ai/`) will be added as teammates integrate their work.

## CI/CD

GitHub Actions runs automatically on:
- Push to `main`, `develop`, or `feature/**`
- Pull requests to `main` or `develop`

The pipeline currently verifies:
1. ✅ Checkout repository
2. ✅ Install frontend dependencies
3. ✅ Run ESLint
4. ✅ Build frontend

Additional stages (backend tests, Docker verification, integration tests) will be added as those modules become available.

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production / stable |
| `develop` | Integration (when created) |
| `feature/*` | Individual development |

> Never push directly to `main`. Always use pull requests.

## License

This project is for educational purposes.
