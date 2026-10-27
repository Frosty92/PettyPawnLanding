// The pet-stolen card, WARLORD HAS STOLEN YOUR PET. (founder, 2026-10-26: "the Pet stolen modal exactly as it appears in the live game"), from PettyPawn's
// Studio → Result cards with zaki's Doberman from the demo fight (/studio-results?demo=1&you=zaki), phone-sized, Studio
// controls hidden. The card is caught 5.4 s after the mate: in, its coins counted, the pet still in colour before the world
// drains grey. Usage: node capture/pawned.mjs "$SCRATCH" assets/screens/pawned.jpg
import { launch, sleep } from './cdp.mjs';
import { HIDE } from './take.mjs';
import { writeFileSync } from 'node:fs';
const [S, out] = process.argv.slice(2);
const app = await launch({ profile: `${S}/chrome-pawned`, port: 9557, width: 390, height: 844, scale: 2 });
try {
  await app.goto('http://localhost:8086/studio-results?demo=1&you=zaki', 9000);
  await app.css(HIDE);
  await app.tapOn('Play WARLORD HAS STOLEN YOUR PET.', { exact: true });
  await sleep(5400);
  const s = await app.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  writeFileSync(out, Buffer.from(s.data, 'base64'));
} finally { await app.close(); }
