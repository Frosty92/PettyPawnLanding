// The PettyPawn demo fight (PettyPawn/docs/exec-plans/active/2026-10-25_pp-landing-page-and-demo-video.md), re-shot from
// the Maidenless take: zaki's Doberman v frosty's Chihuahua, both pets on the line, about 20 s. frosty's taunt is already
// on screen when the clip opens; he smacks (it lands); two plies pass, so his hand has cooled; he smacks again and zaki
// blocks; zaki smacks back and breaks him (BROKEN. holds for the steal, a demo-only hold), plays his own move, lets the
// steal timer run, plays frosty's move for him and mates with Qxf7. zaki's moves, smack and block are taps, shown by a
// fingertip; frosty's are scripted. The clip ends on CHECKMATE. Also saves the walk-out and the opening frame as stills.
import { take, poster, shot, sleep, OUT } from './take.mjs';
import { showTouches, press, moveBy, learnBoard } from './finger.mjs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DEBUG = process.env.DEBUG ? (app, n) => shot(app, `${process.env.SCRATCH}/dbg-demo-${n}.jpg`, 60) : async () => {};
const T0 = Date.now();
let ROLL = null;
const mark = (label) => console.log(((Date.now() - T0) / 1000).toFixed(2), ROLL ? `(clip ${((Date.now() - ROLL) / 1000).toFixed(2)})` : '', label);
const step = async (app, call) => { const r = await app.eval(`window.__demo.${call}`); mark(call); return r; };
const state = async (app, label) => console.log(label, await app.eval('JSON.stringify(window.__demo.health())'));

const { list } = await take('fight', '/studio-combat?demo=1', async (app) => {
  // The walk-out: both pets on the line. Saved as a still, not filmed.
  await step(app, 'walkout()'); await sleep(3800);
  mkdirSync(OUT, { recursive: true });
  await shot(app, join(OUT, 'walkout.jpg'));
  await step(app, 'begin()'); await sleep(900);
  await showTouches(app);
  await learnBoard(app);

  // frosty's word lands just before the camera rolls. A quote spends its three seconds only while the dock shows it,
  // so it has run its course before his hand comes and never returns after the strike.
  await step(app, `taunt(${JSON.stringify('Still thinking? 🥱')})`);
  await sleep(1600);
  app.camera.roll(); ROLL = Date.now();
  await sleep(1550);
  await step(app, 'strikeYou()');                                        // his smack comes; zaki is too slow
  await sleep(1700); await DEBUG(app, '1-landed');

  await moveBy(app, 'd1', 'h5'); mark('3.Qh5');                         // zaki's move, by hand
  await sleep(600);
  await step(app, "theirMove('g7','g6')");                               // 3...g6: two plies, his hand has cooled
  await sleep(600);

  await step(app, 'strikeYou()');                                        // again; this time zaki blocks
  await sleep(300);
  await press(app, 'BLOCK', { exact: true }); mark('block');
  await sleep(1300); await DEBUG(app, '2-blocked');

  await press(app, 'Smack opponent'); mark('smack');                     // zaki's smack; frosty breaks
  await sleep(2200); await DEBUG(app, '3-broken');

  await moveBy(app, 'h5', 'f3'); mark('4.Qf3');                         // zaki's own move
  await sleep(1800);                                                     // the steal timer runs; frosty can only watch
  await moveBy(app, 'c6', 'd4'); mark('4...Nd4 (stolen)');              // frosty's knight, moved by zaki
  await sleep(900); await DEBUG(app, '4-stolen');

  await moveBy(app, 'f3', 'f7'); mark('5.Qxf7#');                       // mate, and its result with it
  await sleep(2800); await DEBUG(app, '5-mate');
  app.camera.cut();                                                      // end on CHECKMATE / VICTORY
  await state(app, 'end');
}, { hold: 0.8 });
poster('fight', list, 0.6);
console.log('frames', list.length, 'seconds', (list.length / 30).toFixed(1));
