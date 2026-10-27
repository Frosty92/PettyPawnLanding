// Shared by every take: open a Studio page in a headless Chrome, film it, and encode the cut.
import { launch, sleep, timeline } from './cdp.mjs';
import { writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

export const BASE = process.env.APP ?? 'http://localhost:8086';
const SCRATCH = process.env.SCRATCH;
const ENCODER = process.env.ENCODER;
export const OUT = new URL('../assets/video/', import.meta.url).pathname;

/** Studio-only controls stay where they are, invisible, so a take shows exactly what a live player sees. */
export const HIDE = [
  '[aria-label="Studio scenes and options"]', '[aria-label="Studio options"]', '[aria-label="Leave the Wall studio"]',
  '[aria-label="Close the intro"]', '[aria-label="Replay the intro"]', '[aria-label="Close studio"]',
].map((s) => `${s}{opacity:0!important}`).join('\n');

export async function take(name, path, script, { settle = 8000, fps = 30, bitrate = 2_000_000, hold = 0 } = {}) {
  const app = await launch({ profile: join(SCRATCH, 'chrome-rec') });
  try {
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
export function encode(name, list, fps = 30, bitrate = 2_000_000) {
  const listFile = join(SCRATCH, `${name}.txt`), tmp = join(SCRATCH, `${name}.mp4`);
  writeFileSync(listFile, list.join('\n'));
  console.log(execFileSync(ENCODER, [listFile, tmp, String(fps), String(bitrate)]).toString().trim());
  mkdirSync(OUT, { recursive: true });
  copyFileSync(tmp, join(OUT, `${name}.mp4`));
}

/** Save the frame `at` seconds into the cut as the video's poster. */
export function poster(name, list, at, fps = 30) {
  copyFileSync(list[Math.min(list.length - 1, Math.round(at * fps))], join(OUT, `${name}.jpg`));
}

/** A full-quality screenshot of the page now. */
export async function shot(app, file, quality = 92) {
  const s = await app.send('Page.captureScreenshot', { format: 'jpeg', quality });
  writeFileSync(file, Buffer.from(s.data, 'base64'));
}
export { sleep };
