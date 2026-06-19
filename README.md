# Lorebound

Build worlds the canon can remember.

Lorebound is a flagship GenLayer dApp for collective worldbuilding with canon
verified by consensus. A community builds one shared fictional universe.
Anyone can propose a new piece of lore, and GenLayer decides whether it may
enter the canon: whether it fits the world rules, holds continuity, avoids
conceptual duplication, matches the narrative tone, and adds something worth
remembering. The frontend is a multi-page, presentation-grade interface built
around a single art direction, the Mythic Interface System, that feels like
entering a living atlas rather than using a SaaS dashboard.

The seeded demo world is The Floating City of Aster.

---

## What Lorebound is

A protocol and interface for shared fictional universes. The core idea: a
world is not a database of entries, it is a living web of rules, tone and
continuity. Lorebound treats each proposed piece of lore as a question against
that web, evaluated under GenLayer consensus, then settled on chain.

Each proposed piece moves through the Continuity Trial and receives one of four
verdicts:

- Accepted: it fits the canon and becomes a new artifact (a new star in the
  constellation).
- Rejected: it breaks a canon rule or duplicates existing canon.
- Needs Revision: it is close but has a fixable fault (a tone break, a single
  contradiction, or heavy overlap with an existing piece).
- Needs Human Canon Vote: it is genuinely ambiguous and should be settled by a
  human canon vote.

## Why GenLayer is essential

Canon is a shared truth. If a single author or a single server decides what is
canon, the community has to trust that authority completely. The decision is
also subjective and evidence-bound: it depends on reading the proposal against
the world rules and the accepted artifacts and forming a judgment. That is
exactly the class of decision GenLayer is built for.

In Lorebound, multiple validators each evaluate a proposal independently and
must agree before the canon changes. The agreement is anchored on a categorical
verdict plus one named numeric world-quantity (Canon Fit) within a tolerance
band, which keeps consensus reachable while still pinning the decision to a
real result rather than free-form prose. The other quantities, the evidence
citations and the reasoning are leader flavor that the validators do not need
to match exactly.

## The problem it solves for creative communities

Collaborative fiction (shared universes, TTRPG settings, fan canons, writers'
rooms) constantly fights two failures: contradiction drift, where new additions
quietly break old rules, and gatekeeping, where one moderator's taste becomes
an opaque law. Lorebound addresses both. Contradictions are detected against
specific stored rules and surfaced as evidence. The accept/reject decision is
reached by independent validators and recorded with a proof hash, so the canon
is auditable rather than personal.

## How canon works

A world has:

- Canon rules: the world's laws (for Aster: cities float above the storm layer,
  the surface below the clouds is cursed, metal attracts sky-beasts, silent
  glass replaces metal in most structures, no one knows what is under the cloud
  floor).
- A tone: the narrative voice the world speaks in (Aster is mythic, hopeful,
  mysterious).
- Canon artifacts: accepted pieces of lore, each with a type, an accepted date,
  a Canon Fit value, connections to other pieces, the source decision and a
  proof hash.

Accepted proposals become new artifacts and are wired into the constellation.

## How the Continuity Trial works

A proposal stands at the center of a ring of the world's canon rules. The
adjudicator (the GenLayer leader) reads the proposal against every rule and
every accepted artifact and produces a structured design: a verdict, four named
quantities (Canon Fit, Continuity Risk, Originality, Tone Match), an evidence
list where each citation must be a real canon rule or artifact, a reason, and a
suggested revision. Validators re-run the evaluation and agree when the verdict
matches exactly and the Canon Fit value is within tolerance.

After consensus, deterministic backstops run in the contract (see below). Only
then does the canon change.

## How the validators work, and why they are not field-checkers

A shallow validator would only confirm that the model returned well-formed JSON
with an allowed verdict. Lorebound does not do that. The contract applies
deterministic backstops in code, after consensus, that can override the model:

1. Evidence check: every cited canon reference must resolve to a real stored
   rule or artifact. A fabricated citation forces a rejection (a decision built
   on invented canon cannot stand).
2. Verdict and risk consistency: an Accepted verdict with a continuity risk
   above a hard threshold is downgraded to Needs Revision.
3. Canon-override guard: if the proposal text tries to instruct the adjudicator
   to ignore or replace the canon (prompt injection), the verdict is forced to
   Rejected before any scoring.
4. Clamping: every numeric quantity is clamped to 0 to 100.

The Validator Chamber page presents six conceptual layers (Evidence,
Contradiction, Tone, Novelty, Revision, Consistency) with a worked example for
each, including the Evidence Validator correcting an imprecise canon citation
rather than rubber-stamping it.

## The pages

1. World Gate (`/`): cinematic portal landing with a live 3D portal scene.
2. Canon Atlas (`/atlas`): the universe as a living constellation of nodes.
3. Lore Forge (`/forge`): propose new lore as a narrative forge.
4. Continuity Trial (`/trial`): the core evaluation stage with the rule ring,
   the living verdict seal, the named gauges, evidence and validator layers.
5. Canon Constellation (`/constellation`): how a piece would change the world.
6. Artifact Hall (`/hall`): a reliquary of floating accepted artifacts.
7. World Memory (`/memory`): a cinematic timeline of the world's evolution.
8. Validator Chamber (`/validators`): the validator results recorded on chain
   for each evaluated proposal.

## Running the frontend

```bash
cd frontend
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build
npm run no-emoji # verify no emoji or em dash in the source
```

The build outputs to `frontend/dist/`. The Vite base is `./` (relative) so the
site works from the Cloudflare Pages root. Routing uses a hash router plus a
`_redirects` SPA fallback.

## Using the Aster demo

The world of Aster is live on chain. Open the Canon Atlas, Artifact Hall or the
Continuity Trial to read its real canon rules, its accepted artifact and its
three judged proposals straight from the contract.

### Submitting a new proposal

Open the Lore Forge, write a proposal and connect a wallet. Submitting signs
`submit_lore_proposal` then `evaluate_lore_proposal` on Bradbury, and the trial
polls the transaction through consensus before reading the real verdict, scores,
evidence and validator results back from chain.

## How the data layer works

The frontend reads everything from the deployed Bradbury contract. On mount and
on a slow background poll, the store loads the world via `get_worlds` /
`get_world_state`, its proposals via `get_proposals`, and the stats via
`get_stats`, then normalizes the JSON each view returns. The read helpers live
in `src/genlayer/genlayerClient.ts` (`fetchStats`, `fetchWorlds`,
`fetchWorldState`, `fetchProposals`, `fetchProposal`, `fetchArtifact`). There is
no local engine and no offline data: a failed read shows an error card with a
retry and an explorer link, never fabricated content.

## The contract

`genlayer/lorebound_contract.py` (class `Lorebound`).

Key methods:

- Writes: `create_world`, `add_canon_rule`, `submit_lore_proposal`,
  `evaluate_lore_proposal` (the AI consensus write).
- Conceptual validator views: `validate_evidence`, `validate_contradictions`,
  `validate_tone_match`, `validate_originality`, `validate_revision`.
- Views: `get_world_state`, `get_canon_artifact`, `get_proposal`, `get_worlds`,
  `get_proposals`, `get_stats`.

`evaluate_lore_proposal` runs the adjudicator under `gl.vm.run_nondet_unsafe`
with a validator function that agrees when the categorical verdict matches and
Canon Fit is within tolerance, then applies the deterministic backstops
described above and mutates the canon.

### Running the contract tests

```bash
cd genlayer
gltest tests/ -v -s --network studionet \
  --default-wait-interval 5000 --default-wait-retries 120
```

The suite covers acceptance, contradiction, fabricated evidence, tone mismatch,
conceptual duplication, and the adversarial canon-override case. The acceptance,
contradiction and adversarial cases exercise the full AI consensus write; the
fabricated-evidence, duplicate and tone cases assert the deterministic backstops
through the validator views where consensus is not needed. If StudioNet is
unreachable, run against a local GLSim or Studio instead.

Lint the contract before testing:

```bash
genvm-lint check genlayer/lorebound_contract.py
```

## Project structure

```
lorebound/
  genlayer/
    lorebound_contract.py     # the Lorebound intelligent contract
    gltest.config.yaml        # gltest paths
    tests/                    # integration tests (acceptance, contradictions, ...)
  frontend/
    public/assets/            # curated webp art (referenced, never generated at runtime)
    src/
      components/             # layout, atlas, forge, trial, constellation, artifacts, validators, animation, shared
      genlayer/               # genlayerClient (on-chain reads + live proposal flow)
      pages/                  # the chambers
      state/                  # the live on-chain world / wallet store
      utils/                  # formatters
      types.ts
    scripts/no-emoji.cjs
```

## Notes

- The frontend reads only from the deployed contract at runtime. No offline
  demo data and no fabricated content: a failed read shows an error state.
- Reduced motion is respected everywhere: the 3D canvases and heavy motion pause
  when the system `prefers-reduced-motion` setting requests it.
- No emojis and no em dash anywhere in the source (`npm run no-emoji`).

## Live deployment

Lorebound is deployed and live. The contract runs on the GenLayer Bradbury testnet, and the world of Aster is already seeded on chain (one world, three proposals judged under real AI consensus, one accepted into canon as an artifact).

```ini
live      = https://lorebound-54f.pages.dev/
contract  = 0xe99B76bFDc1f79F008CCFda5B321533CBC8f0823
deploy_tx = 0xc77592fc6982327dbe542e57266c4dae812ea17573aa908b12156a1cf5f25454
network   = GenLayer Bradbury Testnet (chainId 4221 / 0x107D)
explorer  = https://explorer-bradbury.genlayer.com/address/0xe99B76bFDc1f79F008CCFda5B321533CBC8f0823
faucet    = https://testnet-faucet.genlayer.foundation/
```

The app reads live from the deployed contract on the GenLayer Bradbury testnet: the world of Aster, its canon rules, its artifact and its judged proposals all come from on-chain reads. Hero and chamber imagery was generated once at build time and ships as static local webp assets, so the site makes no third-party API calls beyond the GenLayer RPC.
