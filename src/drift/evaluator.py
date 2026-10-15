"""Continuous Data Drift & Population Stability Index (PSI) Evaluator."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict

import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger("mlops.drift")


@dataclass
class FeatureDriftResult:
    feature_name: str
    drift_detected: bool
    ks_statistic: float
    p_value: float
    psi_score: float
    wasserstein_distance: float


@dataclass
class DriftReport:
    is_dataset_drifted: bool
    drift_share: float
    threshold: float
    features_analyzed: int
    drifted_features_count: int
    metrics_per_feature: Dict[str, FeatureDriftResult] = field(default_factory=dict)


class DriftEvaluator:
    """Evaluates statistical dataset drift using KS-tests, Wasserstein distance, and PSI."""

    def __init__(
        self,
        reference_data: pd.DataFrame,
        drift_share_threshold: float = 0.3,
        alpha: float = 0.05,
        psi_threshold: float = 0.25,
    ):
        self.reference = reference_data
        self.drift_share_threshold = drift_share_threshold
        self.alpha = alpha
        self.psi_threshold = psi_threshold

    def calculate_psi(
        self, expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10
    ) -> float:
        """Calculates Population Stability Index (PSI) between reference and production data."""
        # Clean NaNs
        expected = expected[~np.isnan(expected)]
        actual = actual[~np.isnan(actual)]
        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        quantiles = np.linspace(0, 100, num_buckets + 1)
        breakpoints = np.percentile(expected, quantiles)
        breakpoints[0] = -np.inf
        breakpoints[-1] = np.inf

        expected_counts, _ = np.histogram(expected, bins=breakpoints)
        actual_counts, _ = np.histogram(actual, bins=breakpoints)

        # Smooth zero counts
        expected_pct = np.where(expected_counts == 0, 1e-4, expected_counts) / len(expected)
        actual_pct = np.where(actual_counts == 0, 1e-4, actual_counts) / len(actual)

        psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(psi_val)

    def evaluate(self, current_data: pd.DataFrame) -> DriftReport:
        """Run multi-feature drift testing."""
        drift_results: Dict[str, FeatureDriftResult] = {}
        drifted_count = 0
        numeric_cols = [
            c
            for c in self.reference.select_dtypes(include=[np.number]).columns
            if c in current_data.columns
        ]

        for col in numeric_cols:
            ref_series = self.reference[col].dropna().values
            cur_series = current_data[col].dropna().values

            if len(ref_series) < 5 or len(cur_series) < 5:
                continue

            # Two-sample Kolmogorov-Smirnov test
            ks_res = stats.ks_2samp(ref_series, cur_series)
            # Wasserstein Earth Mover's Distance
            w_dist = stats.wasserstein_distance(ref_series, cur_series)
            # PSI
            psi_val = self.calculate_psi(ref_series, cur_series)

            # Drift detected if p-value < alpha or PSI > threshold
            drift_detected = (ks_res.pvalue < self.alpha) or (psi_val > self.psi_threshold)
            if drift_detected:
                drifted_count += 1

            drift_results[col] = FeatureDriftResult(
                feature_name=col,
                drift_detected=drift_detected,
                ks_statistic=float(ks_res.statistic),
                p_value=float(ks_res.pvalue),
                psi_score=round(psi_val, 4),
                wasserstein_distance=round(float(w_dist), 4),
            )

        total_features = len(numeric_cols)
        drift_share = (drifted_count / total_features) if total_features > 0 else 0.0
        is_dataset_drifted = drift_share >= self.drift_share_threshold

        return DriftReport(
            is_dataset_drifted=is_dataset_drifted,
            drift_share=round(drift_share, 4),
            threshold=self.drift_share_threshold,
            features_analyzed=total_features,
            drifted_features_count=drifted_count,
            metrics_per_feature=drift_results,
        )
