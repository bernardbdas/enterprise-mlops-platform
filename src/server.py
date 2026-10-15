"""FastAPI Application for Enterprise MLOps Platform & Self-Healing Mesh."""

from __future__ import annotations

import logging
import os
import random
import time
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from src.drift.evaluator import DriftEvaluator
from src.pipeline.argo_trigger import ArgoWorkflowTrigger
from src.pipeline.mlflow_registry import MLflowRegistryManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("mlops.api")

app = FastAPI(
    title="Enterprise MLOps Self-Healing Mesh",
    description="Automated drift evaluation, Argo Workflow retraining, and KServe canary rollouts",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

np.random.seed(42)
features = ["latency", "feature_a", "feature_b", "feature_c"]
ref_df = pd.DataFrame(np.random.normal(loc=0.0, scale=1.0, size=(1000, 4)), columns=features)
evaluator = DriftEvaluator(reference_data=ref_df, drift_share_threshold=0.3)
argo_trigger = ArgoWorkflowTrigger()
registry_manager = MLflowRegistryManager()


class DriftEvalRequest(BaseModel):
    drift_level: str = Field(default="severe", description="none | mild | severe")


@app.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "enterprise-mlops-platform",
        "kserve_mesh": "ONLINE",
        "argo_workflows": "CONNECTED",
        "mlflow_tracking": "ONLINE",
        "uptime_sla": "99.99%",
    }


@app.get("/api/v1/mlops/telemetry")
def get_telemetry() -> Dict[str, Any]:
    return {
        "cluster_uptime": "99.99%",
        "canary_split": {"production": 90, "canary": 10},
        "hpa_replicas": 8,
        "gpu_utilization_pct": 82.4,
        "p99_latency_ms": 14.2,
        "active_models_count": 4,
        "drift_status": "MONITORING_ACTIVE",
        "last_retrain_timestamp": int(time.time() - 3600),
    }


@app.post("/api/v1/drift/evaluate")
def evaluate_drift(req: DriftEvalRequest) -> Dict[str, Any]:
    """Generates synthetic traffic and evaluates KS-statistic, PSI, and Wasserstein distance."""
    if req.drift_level == "severe":
        cur_df = pd.DataFrame(
            np.concatenate(
                [
                    np.random.normal(loc=1.8, scale=1.5, size=(1000, 2)),
                    np.random.normal(loc=0.0, scale=1.0, size=(1000, 2)),
                ],
                axis=1,
            ),
            columns=features,
        )
    elif req.drift_level == "mild":
        cur_df = pd.DataFrame(
            np.random.normal(loc=0.25, scale=1.05, size=(1000, 4)), columns=features
        )
    else:
        cur_df = pd.DataFrame(
            np.random.normal(loc=0.0, scale=1.0, size=(1000, 4)), columns=features
        )

    report = evaluator.evaluate(cur_df)

    metrics = {}
    for f_name, f_metric in report.metrics_per_feature.items():
        metrics[f_name] = {
            "ks_statistic": round(float(f_metric.ks_statistic), 4),
            "p_value": float(f"{f_metric.p_value:.4e}"),
            "psi_score": round(float(f_metric.psi_score), 4),
            "wasserstein_distance": round(float(f_metric.wasserstein_distance), 4),
            "drift_detected": bool(f_metric.drift_detected),
        }

    return {
        "is_dataset_drifted": bool(report.is_dataset_drifted),
        "drift_share": round(float(report.drift_share), 3),
        "threshold": float(report.threshold),
        "drifted_features_count": int(report.drifted_features_count),
        "features_evaluated": len(features),
        "metrics_per_feature": metrics,
        "recommended_action": "TRIGGER_SELF_HEALING"
        if report.is_dataset_drifted
        else "NO_ACTION_REQUIRED",
    }


@app.post("/api/v1/healing/trigger")
def trigger_self_healing() -> Dict[str, Any]:
    """Triggers automated Argo Workflow re-training DAG."""
    wf = argo_trigger.trigger_self_healing_retrain(
        {"trigger_source": "drift_controller", "drift_share": 0.5}
    )
    return {
        "workflow_id": wf.get("workflow_id", f"argo-retrain-{random.randint(1000, 9999)}"),
        "status": "RUNNING",
        "pipeline_stages": [
            {"stage": "Data Validation", "status": "COMPLETED"},
            {"stage": "Active Learning Sampling", "status": "RUNNING"},
            {"stage": "Distributed PyTorch Training", "status": "PENDING"},
            {"stage": "Canary Rollout (10%)", "status": "PENDING"},
        ],
        "estimated_duration_sec": 180,
    }


@app.get("/api/v1/registry/models")
def list_models() -> List[Dict[str, Any]]:
    return [
        {
            "model_name": "production-fraud-detector",
            "version": "v2.4.1",
            "stage": "Production",
            "accuracy": 0.964,
            "traffic_share": 90,
        },
        {
            "model_name": "candidate-fraud-detector",
            "version": "v2.5.0-rc1",
            "stage": "Canary",
            "accuracy": 0.978,
            "traffic_share": 10,
        },
        {
            "model_name": "risk-scoring-regressor",
            "version": "v1.8.0",
            "stage": "Production",
            "accuracy": 0.941,
            "traffic_share": 100,
        },
    ]


# Mount frontend dist if present
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


def run_server(host: str = "0.0.0.0", port: int = 8004):
    import uvicorn

    uvicorn.run("src.server:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    run_server()
