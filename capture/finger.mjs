// A fingertip for recordings, like a phone's "show touches": a translucent circle that presses where a tap lands and
// glides between taps. It lives only in the recording browser (injected over the page), never in the app.
import { sleep } from './cdp.mjs';

const OVERLAY = `(() => {
  if (document.getElementById('capture-finger')) return;
  const f = document.createElement('div'); f.id = 'capture-finger';
  Object.assign(f.style, { position: 'fixed', left: '0', top: '0', width: '48px', height: '48px', margin: '-24px 0 0 -24px',
    borderRadius: '50%', background: 'rgba(255,255,255,.34)', border: '2px solid rgba(255,255,255,.8)',
    boxShadow: '0 3px 12px rgba(0,0,0,.45)', pointerEvents: 'none', zIndex: '2147483647', opacity: '0',
    transform: 'translate(-200px,-200px)', transition: 'opacity .16s ease, transform .07s linear' });
  document.body.appendChild(f);
  let x = -200, y = -200, down = false, hide = null;
  const draw = () => { f.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + (down ? .8 : 1) + ')'; };
  const later = (ms) => { clearTimeout(hide); hide = setTimeout(() => { f.style.opacity = '0'; }, ms); };
  addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; draw(); if (f.style.opacity === '1') later(650); }, true);
  addEventListener('mousedown', (e) => { x = e.clientX; y = e.clientY; down = true; clearTimeout(hide); f.style.opacity = '1'; draw(); }, true);
  addEventListener('mouseup', () => { down = false; draw(); later(420); }, true);
  // The recorder keeps the finger up between the two taps of a move, and brings it in before a tap.
  window.__finger = { show: () => { clearTimeout(hide); f.style.opacity = '1'; } };
})()`;

export const showTouches = (app) => app.eval(OVERLAY);

/** Slide the finger from one point to another, eased, in `ms` of real time (each event's round trip counts). */
export async function glide(app, a, b, ms = 380) {
  const start = Date.now();
  for (;;) {
    const t = Math.min(1, (Date.now() - start) / ms), e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    await app.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e });
    if (t >= 1) return;
    await sleep(10);
  }
}

async function find(app, match, opts) {
  for (let i = 0; i < 40; i++) { const p = await app.where(match, opts); if (p) return p; await sleep(120); }
  throw new Error(`Nothing to tap: ${match}`);
}

/** The finger comes in from just below the point, as a hand does, and stops on it. */
async function approach(app, p) {
  const from = { x: p.x + 16, y: p.y + 64 };
  await app.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x, y: from.y });
  await app.eval('window.__finger && window.__finger.show()');
  await glide(app, from, p, 150);
}

/** Tap a control by its label or text. */
export async function press(app, match, opts = {}) {
  const p = await find(app, match, opts);
  await approach(app, p);
  await app.tap(p.x, p.y, 110);
  return p;
}

// Where each square's centre is, read once: the board doesn't move, and searching the page for every tap cost most of
// a second a move.
let board = null;
export async function learnBoard(app) {
  board = await app.eval(`(() => { const out = {};
    for (const e of document.querySelectorAll('[aria-label]')) {
      const m = /^([a-h][1-8]), /.exec(e.getAttribute('aria-label') || ''); if (!m) continue;
      const r = e.getBoundingClientRect(); if (r.width) out[m[1]] = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    } return out; })()`);
  if (Object.keys(board).length !== 64) throw new Error(`Found ${Object.keys(board).length} squares, not 64`);
}
const square = async (app, sq) => board?.[sq] ?? find(app, `${sq}, `);

/** A move as a player makes it: tap the piece, see its squares, glide to the target with the finger still up, tap it. */
export async function moveBy(app, from, to, { look = 260, slide = 320 } = {}) {
  const a = await square(app, from), b = await square(app, to);
  await approach(app, a);
  await app.tap(a.x, a.y, 110);
  await app.eval('window.__finger && window.__finger.show()');
  await sleep(look);
  await glide(app, a, b, slide);
  await app.tap(b.x, b.y, 110);
}
