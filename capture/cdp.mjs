// A tiny Chrome DevTools Protocol driver for recording the app's Studio scenes: launch a headless Chrome, open a
// phone-sized page, tap and hold like a finger, and keep screencast frames while a take is rolling.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333, profile, width = 390, height = 844, scale = 2 }) {
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--mute-audio', '--hide-scrollbars', `--force-device-scale-factor=${scale}`, `--window-size=${width},${height}`, 'about:blank',
  ], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.some((t) => t.type === 'page')) break; } catch {}
    await sleep(200);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(), listeners = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { r, j } = pending.get(m.id); pending.delete(m.id); m.error ? j(new Error(JSON.stringify(m.error))) : r(m.result); }
    else if (m.method) (listeners.get(m.method) ?? []).forEach((f) => f(m.params));
  };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const on = (method, f) => listeners.set(method, [...(listeners.get(method) ?? []), f]);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: true });

  const app = {
    send, on, proc,
    async close() { try { ws.close(); } catch {} proc.kill('SIGTERM'); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async goto(url, settle = 2500) {
      await send('Page.navigate', { url });
      for (let i = 0; i < 100; i++) { await sleep(200); if (await app.eval('document.readyState') === 'complete') break; }
      await sleep(settle);
    },
    /** Hide what only the Studio draws: its pills and close buttons. They stay where they are, invisible. */
    async css(text) {
      await app.eval(`(()=>{let s=document.getElementById('capture-css');if(!s){s=document.createElement('style');s.id='capture-css';document.head.appendChild(s);}s.textContent=${JSON.stringify(text)};})()`);
    },
    /** The centre of the first visible element whose aria-label or own text matches. */
    async where(match, { exact = false, nth = 0 } = {}) {
      return app.eval(`(()=>{const m=${JSON.stringify(match)},ex=${exact};const ok=(s)=>s&&(ex?s.trim()===m:s.includes(m));
        const els=[...document.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;
          const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');return ok(e.getAttribute('aria-label'))||ok(own);});
        const e=els[${nth}];if(!e)return null;let r=e.getBoundingClientRect();
        if(r.bottom>innerHeight||r.top<0){e.scrollIntoView({block:'center'});r=e.getBoundingClientRect();}return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height};})()`);
    },
    async tap(x, y, hold = 60) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
      await sleep(hold);
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
    },
    async tapOn(match, opts = {}) {
      let p = null;
      for (let i = 0; i < 40 && !p; i++) { p = await app.where(match, opts); if (!p) await sleep(150); }
      if (!p) throw new Error(`Nothing to tap: ${match}`);
      await app.tap(p.x, p.y, opts.hold ?? 60);
      return p;
    },
    async type(text) { for (const ch of text) { await send('Input.insertText', { text: ch }); await sleep(90); } },
  };

  // The camera: frames arrive only while the picture changes; each keeps its timestamp.
  let rolling = false, frames = [], dir = null, last = null;
  const keep = (data, t) => {
    const file = join(dir, `${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t });
  };
  on('Page.screencastFrame', async (p) => {
    send('Page.screencastFrameAck', { sessionId: p.sessionId }).catch(() => {});
    last = { data: p.data, t: p.metadata.timestamp };
    if (rolling) keep(p.data, p.metadata.timestamp);
  });
  app.camera = {
    async start(out) {
      dir = out; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); frames = [];
      await send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: width * scale, maxHeight: height * scale, everyNthFrame: 1 });
    },
    // A take that opens on a still picture starts from the last frame seen, restamped to the roll.
    roll() { const at = Date.now() / 1000; if (last) keep(last.data, at); rolling = true; app.camera.cuts.push({ at, roll: true }); },
    cut() { rolling = false; app.camera.cuts.push({ at: Date.now() / 1000, roll: false }); },
    cuts: [],
    async stop() { rolling = false; await send('Page.stopScreencast'); return frames; },
  };
  return app;
}

/** Turn timestamped frames (with the gaps between takes removed) into a constant-rate list for the encoder. */
export function timeline(frames, cuts, fps = 30) {
  // Each take runs from a roll to the next cut; frames are kept in order, and every take's time starts where the last ended.
  const takes = [];
  for (let i = 0; i < cuts.length; i++) if (cuts[i].roll) takes.push([cuts[i].at, cuts[i + 1]?.at ?? Infinity]);
  const out = [];
  let offset = 0;
  for (const [a, b] of takes) {
    const inTake = frames.filter((f) => f.t >= a - 0.05 && f.t <= b);
    if (!inTake.length) continue;
    const start = a, end = Math.min(b, inTake.at(-1).t + 1 / fps);
    for (let t = start; t < end; t += 1 / fps) {
      let pick = inTake[0];
      for (const f of inTake) { if (f.t <= t) pick = f; else break; }
      out.push(pick.file);
    }
    offset += end - start;
  }
  return out;
}
