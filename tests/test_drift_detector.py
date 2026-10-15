import numpy as np
import pandas as pd

from src.drift.evaluator import DriftEvaluator


def test_psi_calculation():
    np.random.seed(42)
    ref = np.random.normal(0, 1, 1000)
    cur_same = np.random.normal(0, 1, 1000)
    cur_shifted = np.random.normal(2, 1, 1000)

    evaluator = DriftEvaluator(reference_data=pd.DataFrame({"x": ref}))

    psi_stable = evaluator.calculate_psi(ref, cur_same)
    psi_drifted = evaluator.calculate_psi(ref, cur_shifted)

    assert psi_stable < 0.1
    assert psi_drifted > 0.25


def test_drift_evaluation_clean():
    np.random.seed(42)
    ref = pd.DataFrame(np.random.normal(0, 1, (500, 2)), columns=["feat1", "feat2"])
    cur = pd.DataFrame(np.random.normal(0, 1, (500, 2)), columns=["feat1", "feat2"])

    evaluator = DriftEvaluator(reference_data=ref, drift_share_threshold=0.5)
    report = evaluator.evaluate(cur)

    assert not report.is_dataset_drifted
    assert report.drifted_features_count == 0


def test_drift_evaluation_detected():
    np.random.seed(42)
    ref = pd.DataFrame(np.random.normal(0, 1, (500, 2)), columns=["feat1", "feat2"])
    # Shift both features heavily
    cur = pd.DataFrame(np.random.normal(3, 1, (500, 2)), columns=["feat1", "feat2"])

    evaluator = DriftEvaluator(reference_data=ref, drift_share_threshold=0.5)
    report = evaluator.evaluate(cur)

    assert report.is_dataset_drifted
    assert report.drifted_features_count == 2
