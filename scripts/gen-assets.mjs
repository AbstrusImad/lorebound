// Lorebound asset generator. Build-time only: calls Gemini (imagen-4.0) to
// create the curated image set, compresses to webp, writes to
// frontend/public/assets/. The deployed site only ever loads these local files.
// Never ships the key. Run: node gen-assets.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';

const ROOT = 'd:/proyectos/genlayer/agent_proyect_creator';
const OUT = ROOT + '/account_0/lorebound/frontend/public/assets';
mkdirSync(OUT, { recursive: true });
const key = readFileSync(ROOT + '/.env', 'utf8').match(/^Gemini_api_key=(.+)$/m)[1].trim();

// Shared art direction so every image belongs to one world (Mythic Interface System).
const STYLE =
  'Mythic Interface System: premium cinematic fantasy concept art, painterly and atmospheric, ' +
  'deep void-indigo and night-violet darkness, royal indigo depth, myth-gold (#F4C95D) light, ' +
  'rune-cyan (#74EBD5) and spirit-blue (#5C8DFF) glows, fine particles, volumetric god rays, ' +
  'elegant, mystical, dimensional, layered depth, subtle, NOT neon cyberpunk, NO text, no letters, no watermark.';

// World canon: The Floating City of Aster. Cities float above a storm of clouds;
// the cursed surface is unreachable; metal attracts sky-beasts; silent glass is
// the building material; no one knows what is under the cloud floor.
const ASSETS = [
  ['world-gate-hero', '16:9', 1920, 'A vast floating city of silent-glass spires suspended high above an endless storm of clouds, a great portal of light opening over it, distant smaller sky-isles, dramatic dawn, the cursed ground hidden far below the cloud floor. Establishing hero shot, awe and scale.'],
  ['atlas-bg', '16:9', 1600, 'A living celestial atlas: a dark constellation map of glowing nodes and thin connecting threads of light floating in deep space-violet, suspended glass plates with faint cartography, ambient and quiet, mostly empty negative space for an interface.'],
  ['forge-bg', '16:9', 1600, 'A narrative forge chamber inside a floating city: a cold furnace of silent glass glowing rune-cyan, molten light shaped into a story-fragment, dark workshop, embers of pale light, contemplative, mostly dark for an interface backdrop.'],
  ['trial-bg', '16:9', 1600, 'A circular trial chamber where five glowing canon rune-rings orbit a central suspended fragment of story-light, threads of continuity stretching outward, solemn judgement hall above the clouds, dramatic central light, dark periphery.'],
  ['constellation-bg', '16:9', 1600, 'A grand constellation of interconnected stars of lore, new stars igniting and broken fragments drifting, threads of gold and cyan light linking them across deep indigo void, cinematic depth, room for overlay.'],
  ['hall-bg', '16:9', 1600, 'A dimensional reliquary hall: floating crystalline relics and suspended artifacts glowing softly in a dark vaulted void of indigo and gold, museum of myth, shafts of light, quiet grandeur, mostly dark.'],
  ['memory-bg', '16:9', 1600, 'A cinematic river of time: a luminous timeline ribbon winding through a nebula of memory, glowing event-motes along it, deep violet and gold, the history of a world flowing, atmospheric and vast.'],
  ['validator-bg', '16:9', 1600, 'An arcane review chamber of layered translucent glass panels, each panel a lens of scrutiny stacked in depth, lines of light tracing evidence between them, precise and serious, cool indigo with gold accents, dark.'],
  ['artifact-skybridge', '1:1', 900, 'A delicate luminous bridge of silent glass threads spanning between two floating sky-isles above the clouds, glowing faintly, an icon-like symbolic portrait of a single revered structure, centered, dark vignette.'],
  ['artifact-silentglass-guild', '1:1', 900, 'A guild emblem of silent glass: an abstract crest of interwoven translucent glass filaments forming a protective sigil, myth-gold and rune-cyan, ceremonial, centered icon on dark.'],
  ['artifact-cloudwardens', '1:1', 900, 'A faction emblem for the Cloudwardens: robed guardian silhouettes standing on a floating watch-platform among clouds, a vigilant order, symbolic heraldic portrait, centered, dark.'],
  ['artifact-lanterns', '1:1', 900, 'The Festival of Falling Lanterns: countless tiny golden lanterns drifting down between floating glass towers at dusk, a luminous celebratory event captured as a single evocative image, centered, dark.'],
  ['artifact-map', '1:1', 900, 'An ancient living map that refuses to show the ground: an ornate floating chart of sky-isles and cloud currents where the lower region dissolves into forbidden mist, mystical relic, centered icon, dark.'],
  ['relic-crystal', '1:1', 800, 'A single floating crystalline relic of silent glass refracting gold and cyan light, slowly turning, abstract precious artifact on a dark void, centered.'],
];

async function imagen(prompt, aspect) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: `${prompt} ${STYLE}` }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect } },
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const t = await r.text();
      if (!r.ok) { console.log(`  retry ${attempt} http ${r.status}: ${t.slice(0, 140)}`); await new Promise(s => setTimeout(s, 5000 * (attempt + 1))); continue; }
      const parts = JSON.parse(t)?.candidates?.[0]?.content?.parts || [];
      const img = parts.find(p => p.inlineData)?.inlineData?.data;
      if (img) return Buffer.from(img, 'base64');
      console.log(`  retry ${attempt} no-image: ${t.slice(0, 140)}`);
    } catch (e) { console.log(`  retry ${attempt} err ${String(e).slice(0, 100)}`); }
    await new Promise(s => setTimeout(s, 5000 * (attempt + 1)));
  }
  return null;
}

let done = 0;
for (const [name, aspect, width, prompt] of ASSETS) {
  const target = `${OUT}/${name}.webp`;
  if (existsSync(target)) { console.log(`SKIP ${name} (exists)`); done++; continue; }
  const png = await imagen(prompt, aspect);
  if (!png) { console.log(`FAIL ${name}`); continue; }
  await sharp(png).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(target);
  done++;
  console.log(`OK ${name}.webp`);
}
console.log(`ASSETS_DONE ${done}/${ASSETS.length}`);
