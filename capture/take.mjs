// Shared by every take: open a Studio page in a headless Chrome, film it, and encode the cut.
import { launch, sleep, timeline } from './cdp.mjs';
import { writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

export const BASE = process.env.APP ?? 'http://localhost:8086';
const SCRATCH = process.env.SCRATCH;
const ENCODER = process.env.ENCODER;
/** Where the clip and its poster go: the page's videos, or `OUT=` a folder of your own for a trial take. */
export const OUT = process.env.OUT ?? new URL('../assets/video/', import.meta.url).pathname;
/** About the rate of the founder's optimized clips of 2026-11-06 (x264 two-pass at 936 kbps), so a re-shoot needs no second pass. */
const BITRATE = Number(process.env.BITRATE ?? 950_000);
/** The park's theme on film (founder, 2026-11-12: Twilight). `THEME=night|twilight|daylight` films another. */
export const THEME = process.env.THEME ?? 'twilight';

/** The app reads the player's theme from `localStorage` before its first screen (src/ui/parkThemeStorage.ts), so it is set
 * before any page script runs. Call before `goto`. */
export const setTheme = (app, theme = THEME) => app.send('Page.addScriptToEvaluateOnNewDocument',
  { source: `try{localStorage.setItem('pettypawn.theme.1',${JSON.stringify(theme)})}catch(e){}` });

/** Studio-only controls stay where they are, invisible, so a take shows exactly what a live player sees. */
export const HIDE = [
  '[aria-label="Studio scenes and options"]', '[aria-label="Studio options"]', '[aria-label="Leave the Wall studio"]',
  '[aria-label="Close the intro"]', '[aria-label="Replay the intro"]', '[aria-label="Close studio"]',
].map((s) => `${s}{opacity:0!important}`).join('\n');

export async function take(name, path, script, { settle = 8000, fps = 30, bitrate = BITRATE, hold = 0 } = {}) {
  const app = await launch({ profile: join(SCRATCH, 'chrome-rec') });
  try {
    await setTheme(app);
    await app.goto(BASE + path, settle);
    await app.css(HIDE);
    const frames = join(SCRATCH, 'frames', name);
    await app.camera.start(frames);
    await sleep(400);
    await script(app);
    const all = await app.camera.stop();
    const list = timeline(all, app.camera.cuts, fps);
    for (let i = 0; i < Math.round(hold * fps); i++) list.push(list.at(-1));
    writeFileSync(join(SCRATCH, `${name}.txt`), list.join('\n'));
    mkdirSync(OUT, { recursive: true });
    encode(name, list, fps, bitrate);
    return { app, list };
  } finally { await app.close(); }
}

/** Encode outside the project (the writer leaves temporary files beside its output), then copy the MP4 in. */
export function encode(name, list, fps = 30, bitrate = BITRATE) {
  const listFile = join(SCRATCH, `${name}.txt`), tmp = join(SCRATCH, `${name}.mp4`);
  writeFileSync(listFile, list.join('\n'));
  console.log(execFileSync(ENCODER, [listFile, tmp, String(fps), String(bitrate)]).toString().trim());
  mkdirSync(OUT, { recursive: true });
  copyFileSync(tmp, join(OUT, `${name}.mp4`));
}

/** Save the frame `at` seconds into the cut as the video's poster, re-saved lighter like the founder's of 2026-11-06. */
export function poster(name, list, at, fps = 30, quality = 50) {
  const out = join(OUT, `${name}.jpg`);
  copyFileSync(list[Math.min(list.length - 1, Math.round(at * fps))], out);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality), out, '--out', out], { stdio: 'ignore' });
}

/** A full-quality screenshot of the page now. */
export async function shot(app, file, quality = 92) {
  const s = await app.send('Page.captureScreenshot', { format: 'jpeg', quality });
  writeFileSync(file, Buffer.from(s.data, 'base64'));
}
export { sleep };
