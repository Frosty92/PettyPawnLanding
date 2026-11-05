// The second section's clip (founder, 2026-11-04; PettyPawn/docs/exec-plans/active/2026-11-04_landing-demo-videos-round-two.md): frosty's
// Slappy Happy up to ×5, then LightsOut with the founder's line glowing on the dark board, zaki (you) v frosty, one continuous game from
// /studio-combat?demo=lights (PettyPawn/src/studio/demoFight.ts), with no zooms. zaki plays on in the dark, and the lights come back
// before the clip ends. zaki's moves are real input, shown by a fingertip; frosty's are scripted. Every beat is timed from the roll.
import { take, poster, shot, sleep } from './take.mjs';
import { showTouches, moveBy, learnBoard } from './finger.mjs';

const CUT = Number(process.env.CUT ?? 16.8);
const SLOW = { look: 420, slide: 420 };
const LINE = 'Why play fast when you can’t think fast?';
const DEBUG = process.env.DEBUG ? (app, n) => shot(app, `${process.env.SCRATCH}/dbg-lights-${n}.jpg`, 60) : async () => {};
let ROLL = null;
const mark = (label) => console.log(ROLL ? `clip ${((Date.now() - ROLL) / 1000).toFixed(2)}` : '', label);
const step = async (app, call) => { const r = await app.eval(`window.__demo.${call}`); mark(call); return r; };
const at = (seconds) => sleep(Math.max(0, ROLL + seconds * 1000 - Date.now()));

const { list } = await take('lights', '/studio-combat?demo=lights', async (app) => {
  await showTouches(app);
  await learnBoard(app);
  await step(app, 'begin()');                                            // zaki's clock starts with the camera
  await sleep(250);
  app.camera.roll(); ROLL = Date.now();

  await at(0.3); await moveBy(app, 'e1', 'g1', SLOW); mark('5.O-O');
  await at(2.1); await step(app, "theirMove('f8','e7')");                // 5...Be7
  await at(2.9); await step(app, "cast('slappy_happy')");
  await at(3.9); await step(app, 'hit()');                               // five slaps; the fifth lands near 9.6
  await sleep(5900); await DEBUG(app, '1-slaps');

  await at(10.6); await step(app, `cast('eclipse', undefined, ${JSON.stringify(LINE)})`);
  await at(12.5); await moveBy(app, 'f1', 'e1', SLOW); mark('6.Re1');    // zaki plays on in the dark
  await DEBUG(app, '2-dark');
  await at(14.6); await step(app, "theirMove('b7','b5')");               // 6...b5
  await at(CUT); await DEBUG(app, '3-back'); app.camera.cut();
  console.log('end', await app.eval('JSON.stringify(window.__demo.health())'));
}, { hold: .8 });                                                        // a beat on the lit board before it loops
poster('lights', list, 12.2);                                            // the dark board, with the line glowing
console.log('frames', list.length, 'seconds', (list.length / 30).toFixed(1));
