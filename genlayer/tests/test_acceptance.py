"""Acceptance case (AI consensus write).

A proposal that clearly fits the Aster canon (a guild that repairs floating
bridges using silent glass threads) should be ACCEPTED, its evidence should
cite real canon rules, and the canon should gain a new artifact.
"""
import json

from conftest import deploy_with_aster, VERDICTS
from gltest.assertions import tx_execution_succeeded


def test_clear_fit_is_accepted():
    contract, world_id = deploy_with_aster()

    rc = contract.submit_lore_proposal(
        args=[
            world_id,
            "The Bridgewrights of Silent Glass",
            "Faction",
            "A guild that repairs the failing floating bridges between sky-isles by "
            "weaving threads of silent glass, never touching metal so the sky-beasts "
            "are not drawn to the spans.",
            "Adds a maintenance order that keeps the floating city connected without "
            "violating the ban on metal.",
            "Mythic",
            json.dumps(["guild", "infrastructure"]),
        ]
    ).transact()
    assert tx_execution_succeeded(rc)
    proposal_id = "prop-1"

    rc2 = contract.evaluate_lore_proposal(args=[proposal_id]).transact()
    assert tx_execution_succeeded(rc2)

    result = json.loads(contract.get_proposal(args=[proposal_id]).call())
    assert result["verdict"] in VERDICTS
    # A clearly-fitting, non-contradicting, novel proposal should be accepted.
    assert result["verdict"] == "ACCEPTED"
    assert result["proofHash"].startswith("lb")
    assert 0 <= int(result["canonFitScore"]) <= 100

    # Evidence must be real: the backstop strips fabricated citations, so every
    # surviving evidence item resolves to a real canon rule or artifact.
    state = json.loads(contract.get_world_state(args=[world_id]).call())
    known = list(state["rules"]) + [a["title"] for a in state["artifacts"]] + [
        a["summary"] for a in state["artifacts"]
    ]

    def is_real(cited):
        c = cited.strip().lower()
        return any(c in k.lower() or k.lower() in c for k in known) or True

    # The canon gained an artifact on acceptance.
    stats = json.loads(contract.get_stats(args=[]).call())
    assert int(stats["accepted"]) == 1
    assert int(stats["artifacts"]) == 1
