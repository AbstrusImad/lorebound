"""Contradiction case (AI consensus write).

A proposal that breaks an explicit canon rule (an underground steel-tower
kingdom, which violates "all cities float above the storm layer", "the surface
is cursed" and "silent glass instead of metal") should NOT be accepted into the
canon. The deterministic contradiction view also confirms the cited rules.
"""
import json

from conftest import deploy_with_aster
from gltest.assertions import tx_execution_succeeded


def test_breaking_a_rule_is_not_accepted():
    contract, world_id = deploy_with_aster()

    text = (
        "A blacksmith kingdom built underground beneath the cursed surface, raising "
        "giant steel towers that pierce the cloud floor from below."
    )
    rc = contract.submit_lore_proposal(
        args=[
            world_id,
            "The Iron Deep",
            "Faction",
            text,
            "Introduces a subterranean steel civilization.",
            "Dark",
            json.dumps(["underground", "steel"]),
        ]
    ).transact()
    assert tx_execution_succeeded(rc)
    proposal_id = "prop-1"

    rc2 = contract.evaluate_lore_proposal(args=[proposal_id]).transact()
    assert tx_execution_succeeded(rc2)

    result = json.loads(contract.get_proposal(args=[proposal_id]).call())
    # Breaking core canon must never be accepted.
    assert result["verdict"] != "ACCEPTED"
    assert result["verdict"] in ("REJECTED", "NEEDS_REVISION", "NEEDS_HUMAN_VOTE")

    # No artifact entered the canon.
    stats = json.loads(contract.get_stats(args=[]).call())
    assert int(stats["accepted"]) == 0

    # The deterministic contradiction view confirms the cited contradiction is
    # real (it points at one or more actual stored rules).
    scan = json.loads(contract.validate_contradictions(args=[world_id, text]).call())
    assert scan["ok"] is False
    assert len(scan["contradicts"]) >= 1
    state = json.loads(contract.get_world_state(args=[world_id]).call())
    for rule in scan["contradicts"]:
        assert rule in state["rules"]
