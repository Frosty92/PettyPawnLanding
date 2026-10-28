// The Petty Match walk-out as a still (the No Chill section's picture): both pets on the line, from /studio-combat?demo=1
// (PettyPawn/src/studio/demoFight.ts), Studio controls hidden. Saved to assets/video/walkout.jpg; nothing is filmed.
// usage: SCRATCH=… node walkout.mjs
import { launch, sleep } from './cdp.mjs';
import { BASE, HIDE, OUT } from './take.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const app = await launch({ profile: join(process.env.SCRATCH, 'chrome-walkout'), port: 9557 });
try {
  await app.goto(BASE + '/studio-combat?demo=1', 8000);
  await app.css(HIDE);
  await app.eval('window.__demo.walkout()');
  await sleep(3800);
  mkdirSync(OUT, { recursive: true });
  const s = await app.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  writeFileSync(join(OUT, 'walkout.jpg'), Buffer.from(s.data, 'base64'));
  console.log('walkout.jpg', await app.eval(`[...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).filter(Boolean).slice(0,12).join(' | ')`));
} finally { await app.close(); }
