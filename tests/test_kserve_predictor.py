from src.serving.kserve_model import EnterpriseKServeModel


def test_kserve_predict():
    model = EnterpriseKServeModel(name="test-predictor")
    payload = {
        "inputs": [
            {
                "name": "input-0",
                "shape": [2, 4],
                "datatype": "FP32",
                "data": [
                    [0.1, 0.2, 0.3, 0.4],
                    [0.5, 0.6, 0.7, 0.8],
                ],
            }
        ]
    }
    result = model.predict(payload)

    assert result["model_name"] == "test-predictor"
    assert len(result["outputs"]) == 2
    probs = result["outputs"][0]["data"]
    assert len(probs) == 2
    assert len(probs[0]) == 2
