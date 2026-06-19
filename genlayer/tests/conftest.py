"""Shared fixtures for the Lorebound contract integration tests.

The Aster world is the canonical demo universe used across the suite. Each test
deploys a fresh contract and seeds Aster so the tests are independent.
"""
import json

import pytest
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

ASTER_RULES = [
    "The surface below the clouds is cursed.",
    "All cities float above the storm layer.",
    "Metal attracts sky-beasts.",
    "Silent glass is used instead of metal for most structures.",
    "No one knows what exists under the cloud floor.",
]
ASTER_TONE = "Mythic, hopeful, mysterious"

VERDICTS = ("ACCEPTED", "REJECTED", "NEEDS_REVISION", "NEEDS_HUMAN_VOTE")


def deploy_with_aster():
    """Deploy a fresh Lorebound and seed the Floating City of Aster world.

    Returns (contract, world_id).
    """
    factory = get_contract_factory("Lorebound")
    contract = factory.deploy(args=[])

    rc = contract.create_world(
        args=["The Floating City of Aster", json.dumps(ASTER_RULES), ASTER_TONE]
    ).transact()
    assert tx_execution_succeeded(rc)

    # The deterministic worldId for the first world.
    world_id = "world-1"
    state = json.loads(contract.get_world_state(args=[world_id]).call())
    assert len(state["rules"]) == len(ASTER_RULES)
    return contract, world_id


def submit(contract, world_id, title, ptype, text, contribution, tone, tags=None):
    """Submit a proposal and return its deterministic proposalId."""
    rc = contract.submit_lore_proposal(
        args=[world_id, title, ptype, text, contribution, tone, json.dumps(tags or [])]
    ).transact()
    assert tx_execution_succeeded(rc)
    return rc


def evaluate(contract, proposal_id):
    """Run the AI consensus evaluation and return the parsed proposal JSON."""
    rc = contract.evaluate_lore_proposal(args=[proposal_id]).transact()
    assert tx_execution_succeeded(rc)
    return json.loads(contract.get_proposal(args=[proposal_id]).call())


@pytest.fixture
def aster():
    return deploy_with_aster()
