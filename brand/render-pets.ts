// The Park's residents for the landing page, drawn by PettyPawn's own pet engine (PettyPawn/src/queen): each breed as it
// first looks, in its own mood, with and without the app's charcoal portrait. No sticker borders (founder, 2026-10-23).
// From PettyPawn/:  npx tsx ../pp-landing/brand/render-pets.ts ../pp-landing/assets/pets
import { writeFileSync } from 'node:fs';
import { buildLayers, composeSvg, expression } from '../../PettyPawn/src/queen/queenSvg';
import { withPet, BREEDS } from '../../PettyPawn/src/queen/petArt';
import { seededLook } from '../../PettyPawn/src/queen/look';

const out = process.argv[2];
const staging = (bg: boolean) => ({ crown: 0, jewels: 0, sweep: null, bg, grain: false, shadow: false });
for (const b of BREEDS) {
  const look = withPet({ ...seededLook(`landing-${b.id}`), marks: [] }, { kind: b.kind, breed: b.id, pattern: 'falls' });
  const L = buildLayers(look, `p${b.id.replace(/[^a-z]/g, '')}`);
  writeFileSync(`${out}/${b.id}.svg`, composeSvg(L, expression('regal'), staging(true)));
  writeFileSync(`${out}/${b.id}-bare.svg`, composeSvg(L, expression('regal'), staging(false)));
}
console.log('ok', BREEDS.map((b) => `${b.id}:${b.mood}`).join(' '));
