// The Board (Most Wanted) from PettyPawn's Studio, phone-sized, Studio controls hidden.
import { launch, sleep } from './cdp.mjs';
import { HIDE } from './take.mjs';
import { writeFileSync } from 'node:fs';
const [S, path, out] = process.argv.slice(2);
const app = await launch({ profile: `${S}/chrome-board`, port: 9556, width: 390, height: 844, scale: 2 });
try {
  await app.goto(`http://localhost:8086${path}`, 9000);
  await app.css(HIDE);
  await sleep(1200);
  console.log(await app.eval(`[...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')).filter(Boolean).slice(0,40).join(' | ')`));
  const s = await app.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  writeFileSync(out, Buffer.from(s.data, 'base64'));
} finally { await app.close(); }
