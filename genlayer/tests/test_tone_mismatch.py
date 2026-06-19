"""Tone-mismatch case.

A proposal that breaks no canon rule but is tonally off (a comedic robot
salesman in a mythic, hopeful, mysterious world) should not be a clean ACCEPTED.
The deterministic tone view confirms the mismatch the adjudicator weighs.
"""
import json

from conftest import deploy_with_aster
from gltest.assertions import tx_execution_succeeded


def test_tone_view_detects_mismatch():
    contract, world_id = deploy_with_aster()
    out = json.loads(contract.validate_tone_match(args=[world_id, "Comedic"]).call())
    assert out["aligned"] is False


def test_tone_view_accepts_aligned():
    contract, world_id = deploy_with_aster()
    out = json.loads(contract.validate_tone_match(args=[world_id, "Mythic"]).call())
    assert out["aligned"] is True
