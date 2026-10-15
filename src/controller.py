"""Self-Healing MLOps Platform Continuous Monitoring Controller."""

from __future__ import annotations

import logging

import click
import numpy as np
import pandas as pd
from rich.console import Console
from rich.table import Table

from .drift.evaluator import DriftEvaluator
from .pipeline.argo_trigger import ArgoWorkflowTrigger

console = Console()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


@click.group()
def main():
    """Enterprise MLOps Self-Healing Controller CLI."""
    pass


@main.command()
@click.option("--drift-level", type=click.Choice(["none", "mild", "severe"]), default="severe")
def monitor(drift_level: str):
    """Simulates production traffic stream and triggers automated self-healing on drift."""
    console.print(
        f"[bold cyan]Running continuous evaluation loop (simulated drift: {drift_level})...[/bold cyan]"
    )

    np.random.seed(42)
    features = ["latency", "feature_a", "feature_b", "feature_c"]
    ref_df = pd.DataFrame(np.random.normal(loc=0.0, scale=1.0, size=(1000, 4)), columns=features)

    # Generate current production traffic
    if drift_level == "severe":
        # Introduce significant distribution shift
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
    elif drift_level == "mild":
        cur_df = pd.DataFrame(
            np.random.normal(loc=0.2, scale=1.05, size=(1000, 4)), columns=features
        )
    else:
        cur_df = pd.DataFrame(
            np.random.normal(loc=0.0, scale=1.0, size=(1000, 4)), columns=features
        )

    evaluator = DriftEvaluator(reference_data=ref_df, drift_share_threshold=0.3)
    report = evaluator.evaluate(cur_df)

    table = Table(title="Continuous Drift & Data Quality Evaluation")
    table.add_column("Feature", style="bold")
    table.add_column("KS Stat", justify="right")
    table.add_column("p-value", justify="right")
    table.add_column("PSI Score", justify="right")
    table.add_column("Wasserstein", justify="right")
    table.add_column("Drifted?", justify="center")

    for f_name, f_metric in report.metrics_per_feature.items():
        drift_pill = "[red]DRIFTED[/red]" if f_metric.drift_detected else "[green]STABLE[/green]"
        table.add_row(
            f_name,
            f"{f_metric.ks_statistic:.4f}",
            f"{f_metric.p_value:.4e}",
            f"{f_metric.psi_score:.4f}",
            f"{f_metric.wasserstein_distance:.4f}",
            drift_pill,
        )

    console.print(table)

    if report.is_dataset_drifted:
        console.print(
            f"[bold red]CRITICAL: Dataset Drift Share {report.drift_share * 100:.1f}% exceeds threshold {report.threshold * 100:.1f}%![/bold red]"
        )
        argo = ArgoWorkflowTrigger()
        wf_res = argo.trigger_self_healing_retrain({"drift_share": report.drift_share})
        console.print(
            f"[bold green]Triggered Argo Retraining DAG:[/bold green] {wf_res['workflow_id']}"
        )
    else:
        console.print(
            f"[bold green]Dataset within healthy operational SLA (Drift Share: {report.drift_share * 100:.1f}%). No retraining required.[/bold green]"
        )


@main.command()
@click.option("--host", default="0.0.0.0", help="Host interface to bind")
@click.option("--port", default=8004, type=int, help="Port to listen on")
def serve(host: str, port: int):
    """Launch the Enterprise MLOps Platform FastAPI backend & UI."""
    from rich.panel import Panel

    console.print(
        Panel.fit(
            f"[bold cyan]ENTERPRISE MLOPS PLATFORM & SELF-HEALING MESH[/bold cyan]\n"
            f"[dim]Serving API on [bold green]http://{host}:{port}[/bold green][/dim]\n"
            f"[yellow]SYS_04 // KServe + Evidently AI + Argo Workflows + MLflow[/yellow]",
            border_style="cyan",
        )
    )
    import uvicorn

    uvicorn.run("src.server:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    main()
