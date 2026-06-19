import type { World, CanonArtifact } from '../types'

// The seeded demo universe: The Floating City of Aster.
// Five canon rules define the world's laws. Five accepted artifacts already
// live in the canon, each tied to one of the generated artifact images.

export const ASTER_RULES = [
  'The surface below the clouds is cursed.',
  'All cities float above the storm layer.',
  'Metal attracts sky-beasts.',
  'Silent glass is used instead of metal for most structures.',
  'No one knows what exists under the cloud floor.'
]

export const ASTER_TONE_TAGS = ['Mythic', 'Hopeful', 'Mysterious'] as const
export const ASTER_TONE = 'Mythic, hopeful, mysterious'

const seedArtifacts: CanonArtifact[] = [
  {
    artifactId: 'art-seed-1',
    worldId: 'world-aster',
    title: 'The Skybridge of Veyr',
    type: 'Location',
    summary:
      'A delicate span of silent glass threads linking two sky-isles, raised after the old metal bridge drew a sky-beast that tore it down.',
    canonFitScore: 96,
    proofHash: 'lb5f1c9a02e7d3b840',
    sourceProposal: 'seed',
    accepted: 'The Founders',
    acceptedDate: '2031-02-11',
    x: 0.24,
    y: 0.32,
    connections: ['art-seed-2', 'art-seed-3'],
    image: '/assets/artifact-skybridge.webp'
  },
  {
    artifactId: 'art-seed-2',
    worldId: 'world-aster',
    title: 'The Silent Glass Guild',
    type: 'Faction',
    summary:
      'The order that shapes silent glass into spires, bridges and lenses. They guard the craft that lets Aster live without metal.',
    canonFitScore: 98,
    proofHash: 'lb91b340dd5a7c0e62',
    sourceProposal: 'seed',
    accepted: 'The Founders',
    acceptedDate: '2031-02-12',
    x: 0.46,
    y: 0.5,
    connections: ['art-seed-1', 'art-seed-3', 'art-seed-5'],
    image: '/assets/artifact-silentglass-guild.webp'
  },
  {
    artifactId: 'art-seed-3',
    worldId: 'world-aster',
    title: 'The Cloudwardens',
    type: 'Faction',
    summary:
      'Watchers who patrol the storm layer for sky-beasts and falling isles, sworn never to descend toward the cursed ground.',
    canonFitScore: 92,
    proofHash: 'lb2adf77c1903e8b41',
    sourceProposal: 'seed',
    accepted: 'The Founders',
    acceptedDate: '2031-03-02',
    x: 0.68,
    y: 0.36,
    connections: ['art-seed-2', 'art-seed-4'],
    image: '/assets/artifact-cloudwardens.webp'
  },
  {
    artifactId: 'art-seed-4',
    worldId: 'world-aster',
    title: 'The Festival of Falling Lanterns',
    type: 'Event',
    summary:
      'Once a year the city releases countless silent-glass lanterns into the storm, a hopeful rite remembering those lost to the clouds.',
    canonFitScore: 90,
    proofHash: 'lb7c0e1a9b34d5f228',
    sourceProposal: 'seed',
    accepted: 'The Founders',
    acceptedDate: '2031-05-19',
    x: 0.78,
    y: 0.62,
    connections: ['art-seed-3'],
    image: '/assets/artifact-lanterns.webp'
  },
  {
    artifactId: 'art-seed-5',
    worldId: 'world-aster',
    title: 'The Map That Refuses the Ground',
    type: 'Relic',
    summary:
      'An ancient living chart of sky-isles and cloud currents whose lower region always dissolves into mist, refusing to show the surface.',
    canonFitScore: 94,
    proofHash: 'lb33aa12fe6b9c7d05',
    sourceProposal: 'seed',
    accepted: 'The Founders',
    acceptedDate: '2031-06-30',
    x: 0.4,
    y: 0.74,
    connections: ['art-seed-2'],
    image: '/assets/artifact-map.webp'
  }
]

export function buildAsterWorld(): World {
  return {
    worldId: 'world-aster',
    name: 'The Floating City of Aster',
    rules: ASTER_RULES.map((text, i) => ({ id: `rule-${i + 1}`, text })),
    tone: ASTER_TONE,
    toneTags: [...ASTER_TONE_TAGS],
    created: 'The Founders',
    artifacts: seedArtifacts.map((a) => ({ ...a, connections: [...a.connections] }))
  }
}
