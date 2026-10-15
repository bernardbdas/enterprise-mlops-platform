# Multi-Stage Build: Bun Frontend + uv Python Backend

FROM oven/bun:1.2-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install
COPY frontend/ ./
RUN bun run build

FROM python:3.11-slim AS runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock* ./
RUN uv pip install --system -e .

COPY src/ ./src/
COPY k8s/ ./k8s/
COPY terraform/ ./terraform/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8004

CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8004"]
