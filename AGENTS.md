# ==============================================================================
# AGENTS.MD — ENTERPRISE MLOPS PLATFORM (SYS_04)
# Production Architecture, Rules & Operational Directives
# Author: Bernard Birendra Das (https://github.com/bernardbdas)
# ==============================================================================

> **MANDATORY SPECIFICATION FOR AUTONOMOUS AGENTS AND DEVELOPERS**
> This repository strictly adheres to the engineering standards, architecture, and design styles specified herein. No simplifications, removals, or degradations are permitted.

---

## 1. System Topology & Identity

- **System ID**: `SYS_04`
- **Repository Name**: `enterprise-mlops-platform`
- **Primary Domain**: Cloud-Native Enterprise MLOps Control Plane with Evidentiary Drift Detection, Argo Workflows Retraining & KServe v2 Predictor
- **Backend Port**: `8004` (FastAPI)
- **Frontend Framework**: Vite + React 19 + TypeScript (Scaffolded with `bun`)
- **Frontend Port (Dev)**: `5173`
- **UI Aesthetic Style**: **Industrial Brutalist Mission Control / Telemetry Command Deck** (Inspired by Bernard's portfolio `bernardbdas.github.io` & UXPlanet Industrial Brutalism)
  - Color Palette: Heavy industrial slate `#0b0f19`, amber warning `#f59e0b`, alert red `#ef4444`, telemetry cyan `#06b6d4`, steel borders `#1e293b`
  - Typography: Monospace (`JetBrains Mono`, `IBM Plex Mono`)
  - Layout: High-density mission control center with feature drift p-value matrices, automated Argo DAG triggers, KServe v2 latency histograms, and self-healing retraining logs
- **Domain CLI**: `mlops-controller` (`src/controller.py`)

---

## 2. Decoupled Architecture & Execution Directives

1. **Decoupled Independence**:
   - Backend and frontend are completely decoupled and must run independently.
   - Run backend independently: `just backend` (FastAPI on port `8004`).
   - Run frontend independently: `just frontend` (Vite dev server on port `5173`).
   - Run both concurrently: `just dev`.
2. **Production Serving**:
   - Compiling frontend via `just build` writes to `frontend/dist`.
   - In production, FastAPI statically mounts `frontend/dist` at `/`.
   - API endpoints (`/health`, `/metrics`, `/api/drift/check`, `/api/pipeline/trigger`, `/api/predict`) always take routing priority.

---

## 3. Project Management with `uv`

1. **UV Enforcement**: All Python environment management, locking, and execution MUST use `uv`.
2. **Build System**: Managed via `hatchling` in `pyproject.toml`:
   ```toml
   [build-system]
   requires = ["hatchling"]
   build-backend = "hatchling.build"

   [tool.hatch.build.targets.wheel]
   packages = ["src"]
   ```

---

## 4. Frontend & UI Design Rules (`bun` & Industrial Brutalism)

1. Managed exclusively using `bun` inside `frontend/`.
2. Industrial Mission Control styling:
   - High-density p-value Kolmogorov-Smirnov drift charts.
   - Interactive trigger button for automated self-healing retraining DAGs.
   - Live telemetry status badges (Argo Workflows, KServe v2, Evidently AI, S3 Artifact Registry).

---

## 5. Command Runner (`just`) Specification

Standardized `Justfile` tasks:
- `just backend`: Run FastAPI server (`http://localhost:8004`) with reload.
- `just frontend`: Run Bun frontend dev server.
- `just dev`: Launch backend and frontend concurrently.
- `just install`: Install backend with `uv sync --extra dev` and frontend with `bun install`.
- `just test`: Run `uv run pytest` and frontend TypeScript check.
- `just build`: Compile frontend to `dist/` and build Python wheel.
- `just check`: Run `uv run ruff check src` and format checks.
- `just check-drift`: Execute Kolmogorov-Smirnov statistical drift test.
- `just trigger-argo`: Submit simulated Argo retraining workflow DAG.
- `just docker-build`: Build multi-stage production Docker image.
- `just docker-up`: Start MLOps services via Docker Compose.

---

## 6. Containerization & Docker

- Multi-stage `Dockerfile`:
  - Stage 1: `oven/bun:1-alpine` compiles `frontend/dist`.
  - Stage 2: `python:3.11-slim` installs dependencies via `uv sync --frozen --no-dev` and hosts FastAPI.
- `docker-compose.yml`: Spins up `enterprise-mlops-platform`, `localstack` (S3/SQS), and mock services.

---

## 7. Developer Tooling & `.vscode` Setup

- `.vscode/settings.json`: Configured with Ruff default formatter, format on save, and `.venv` python interpreter path.
- `.vscode/launch.json`: Debugging configurations for FastAPI backend, CLI commands, and Chrome frontend.
- `.vscode/extensions.json`: Recommended VS Code extensions.
- `.vscode/tasks.json`: Standard VS Code build and test tasks wired to `just`.

---

## 8. Environment Management Rules

- `example.env`: Tracked template with descriptions for MLflow tracking URI, S3 bucket, and Argo namespace.
- `local.env`: Tracked developer defaults for immediate out-of-the-box local execution.
- `.env` / `.env.local`: Ignored in `.gitignore` for private cloud credentials.

---

## 9. Code Quality, Linters & Pre-Commit Hooks

- Linter & Formatter: `ruff` with `select = ["E", "F", "I"]`, `line-length = 100`.
- Pre-commit hooks (`.pre-commit-config.yaml`):
  - `trailing-whitespace`, `end-of-file-fixer`, `check-yaml`, `check-toml`, `check-added-large-files` (`--maxkb=5000`), `ruff`, and `ruff-format`.
- All git commits must be verified against pre-commit hooks.

---

## 10. Continuous Integration (CI)

- `.github/workflows/ci.yml` runs on every push and PR to `main`:
  - Python lint (`ruff check src`) and test (`pytest`).
  - Bun frontend typecheck (`tsc -b`) and build (`bun run build`).

---

## 11. Git & Remote Repository Rules

- Branch: `main`.
- Remote: `https://github.com/bernardbdas/enterprise-mlops-platform.git`.
