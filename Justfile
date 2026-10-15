# ═══════════════════════════════════════════════════════════════════════
# SYS_04 // ENTERPRISE MLOPS PLATFORM JUSTFILE
# Frontend: Vite + React 19 + TypeScript (Bun)
# Backend:  FastAPI + KServe + Evidently AI + Argo Workflows (Python uv)
# ═══════════════════════════════════════════════════════════════════════

default:
    @just --list

install:
    @echo "[+] Syncing Python backend dependencies with uv..."
    uv sync --extra dev
    @echo "[+] Installing React frontend dependencies with bun..."
    cd frontend && bun install

# Run backend independently on port 8004
backend host="0.0.0.0" port="8004":
    @echo "[*] Launching Enterprise MLOps Platform backend on http://{{host}}:{{port}}..."
    uv run uvicorn src.server:app --host {{host}} --port {{port}} --reload

# Run frontend independently on port 5174 (proxies /api to :8004)
frontend:
    @echo "[*] Launching Vite React frontend on http://localhost:5174..."
    cd frontend && bun run dev

# Run both backend and frontend concurrently
dev:
    @echo "[*] Launching Enterprise MLOps Mesh (Backend: :8004 | Frontend: :5174)..."
    (trap 'kill 0' SIGINT; just backend & just frontend)

# Build production bundle with Vite
build:
    @echo "[*] Building Vite frontend production bundle..."
    cd frontend && bun run build

# Run test suite
test:
    @echo "[*] Running backend pytest suite..."
    uv run pytest
    @echo "[*] Typechecking frontend..."
    cd frontend && bun run build

# Run continuous drift evaluation loop via CLI
monitor drift="severe":
    uv run mlops-controller monitor --drift-level {{drift}}

docker-build:
    docker build -t enterprise-mlops-platform:latest .

docker-up:
    docker compose up -d

docker-down:
    docker compose down
