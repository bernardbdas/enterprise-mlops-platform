```
███▄ ▄███▓ ██▓     ▒█████   ██▓███    ██████
▓██▒▀█▀ ██▒▓██▒    ▒██▒  ██▒▓██░  ██▒▒██    ▒
▓██    ▓██░▒██░    ▒██░  ██▒▓██░ ██▓▒░ ▓██▄
▒██    ▒██ ▒██░    ▒██   ██░▒██▄█▓▒ ▒  ▒   ██▒
▒██▒   ░██▒░██████▒░ ████▓▒░▒██▒ ░  ░▒██████▒▒
░ ▒░   ░  ░░ ▒░▓  ░░ ▒░▒░▒░ ▒▓▒░ ░  ░▒ ▒▓▒ ▒ ░
░  ░      ░░ ░ ▒  ░  ░ ▒ ▒░ ░▒ ░     ░ ░▒  ░ ░
░      ░     ░ ░   ░ ░ ░ ▒  ░░       ░  ░  ░
       ░       ░  ░    ░ ░                 ░
```

# SYS_04 // SELF-HEALING ENTERPRISE MLOPS PLATFORM

```
[SYSTEM ID]       SYS_04
[ARCHITECTURE]    Self-Healing Continuous Evaluation Mesh & Canary Controller
[ORCHESTRATION]   Kubernetes + KServe v2 + Argo Workflows + MLflow 2.13
[MONITORING]      Evidently AI (PSI, KS-Test, Wasserstein) + KEDA HPA
[FRONTEND STACK]  Vite + React 19 + TypeScript (Bun)
[BACKEND STACK]   FastAPI + Ray + Python 3.11 (Managed with uv)
[COMMAND RUNNER]  just (Justfile)
[PERF METRICS]    99.99% Uptime // Sub-Second GPU HPA // Zero-Downtime Rollouts
```

---

## ⚡ ARCHITECTURAL SPECIFICATIONS

Cloud-native automated MLOps harness managing the entire machine learning lifecycle from continuous drift monitoring to automated active-learning retraining DAGs on Argo Workflows and zero-downtime canary deployments on KServe.

```
                    ┌────────────────────────────────────────┐
                    │       Production Inference Stream      │
                    │        (KServe v2 Data Plane)          │
                    └───────┬────────────────────────┬───────┘
                            │                        │
             ┌──────────────▼──────────┐  ┌──────────▼──────────────┐
             │  Live Production Traffic│  │   Canary Traffic (10%)  │
             │   (v2.4.1 - 90% Split)  │  │   (v2.5.0-rc1 Candidate)│
             └──────────────┬──────────┘  └──────────┬──────────────┘
                            │                        │
                            └──────────┬─────────────┘
                                       │
                    ┌──────────────────▼─────────────────────┐
                    │      Evidently AI Drift Evaluator      │
                    │      - Kolmogorov-Smirnov Test (p<0.05)│
                    │      - Population Stability Index (PSI)│
                    │      - Wasserstein Distance Threshold  │
                    └──────────────────┬─────────────────────┘
                                       │
                     [Drift Share > 30% Threshold Exceeded]
                                       │
                    ┌──────────────────▼─────────────────────┐
                    │         Argo Workflows Controller      │
                    │      - Active Learning Data Sampling   │
                    │      - Distributed Retraining (Ray)    │
                    │      - MLflow Validation & Registry    │
                    │      - Automated Canary Rollout (10%)  │
                    └────────────────────────────────────────┘
```

---

## 🛠 INDEPENDENT EXECUTION WITH `just`

Frontend and backend run independently or concurrently:

```bash
# Display all recipes
just

# Install both backend (uv) and frontend (bun) dependencies
just install

# Run backend independently on http://localhost:8004
just backend

# Run frontend independently on http://localhost:5174
just frontend

# Run both backend and frontend concurrently
just dev

# Run comprehensive test suite
just test

# Execute live drift evaluation loop via CLI
just monitor drift="severe"
```

---

## 📦 CONTAINERIZATION (DOCKER & DOCKER-COMPOSE)

```bash
# Build multi-stage production container
just docker-build

# Launch the MLOps controller container
just docker-up

# Verify health
curl -s http://localhost:8004/health | jq .
```

---

## 🌐 API SPECIFICATION

| Verb | Path | Description |
|---|---|---|
| `GET` | `/health` | Cluster health, KServe, Argo, and MLflow states |
| `GET` | `/api/v1/mlops/telemetry` | Uptime SLA, canary split, KEDA HPA replicas |
| `POST` | `/api/v1/drift/evaluate` | Run KS-test, PSI, and Wasserstein drift metrics |
| `POST` | `/api/v1/healing/trigger` | Trigger automated Argo Workflow retraining DAG |
| `GET` | `/api/v1/registry/models` | List MLflow registered models and rollout stages |
