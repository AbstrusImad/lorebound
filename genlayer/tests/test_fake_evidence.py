"""Fabricated-evidence backstop (deterministic logic).

The evidence-check backstop forces REJECTED when an evaluation cites a canon
rule that does not exist in the world. Consensus is not required to prove this:
the validate_evidence view runs the exact deterministic check the backstop uses,
so we assert it directly against a fabricated citation, and against a real one.
"""
import json

from conftest import deploy_with_aster


def test_fabricated_citation_is_detected():
    contract, world_id = deploy_with_aster()

    # A rule that is NOT part of Aster's canon.
    fabricated = [
        {"canonRule": "Dragons rule the molten core of the planet.", "relevance": "x"}
    ]
    out = json.loads(contract.validate_evidence(args=[world_id, json.dumps(fabricated)]).call())
    assert out["ok"] is False
    assert len(out["fabricated"]) == 1
    assert len(out["real"]) == 0


def test_real_citation_passes():
    contract, world_id = deploy_with_aster()

    real = [
        {"canonRule": "Metal attracts sky-beasts.", "relevance": "directly relevant"},
        {"canonRule": "Silent glass is used instead of metal", "relevance": "paraphrase"},
    ]
    out = json.loads(contract.validate_evidence(args=[world_id, json.dumps(real)]).call())
    assert out["ok"] is True
    assert len(out["real"]) == 2
    assert len(out["fabricated"]) == 0
