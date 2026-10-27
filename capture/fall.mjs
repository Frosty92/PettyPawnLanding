// The story's clip (founder, 2026-10-26; PettyPawn/docs/exec-plans/active/2026-10-25_pp-landing-page-and-demo-video.md):
// the hero's Dragon a few moves on, and how it ends, from /studio-combat?demo=fall (PettyPawn/src/studio/demoFight.ts).
// Both bars stand at 20. zaki plays Qe3; frosty plays Be6 and smacks, and it lands: zaki's health hits zero. frosty
// steals zaki's turn and plays Rc1 for zaki, and Qxa2 is mate. The card: FROSTY HAS STOLEN YOUR PET. zaki's move is a
// tap, shown by a fingertip; frosty's are scripted. Every beat is timed from the roll.
import { take, poster, shot, sleep } from './take.mjs';
import { showTouches, moveBy, learnBoard } from './finger.mjs';

const CUT = Number(process.env.CUT ?? 13.6);
const DEBUG = process.env.DEBUG ? (app, n) => shot(app, `${process.env.SCRATCH}/dbg-fall-${n}.jpg`, 60) : async () => {};
let ROLL = null;
const mark = (label) => console.log(ROLL ? `clip ${((Date.now() - ROLL) / 1000).toFixed(2)}` : '', label);
const step = async (app, call) => { const r = await app.eval(`window.__demo.${call}`); mark(call); return r; };
const at = (seconds) => sleep(Math.max(0, ROLL + seconds * 1000 - Date.now()));

const { list } = await take('fall', '/studio-combat?demo=fall', async (app) => {
  await showTouches(app);
  await learnBoard(app);
  await step(app, 'begin()');                                            // zaki's clock starts with the camera
  await sleep(250);
  app.camera.roll(); ROLL = Date.now();

  await at(0.2); await moveBy(app, 'd2', 'e3'); mark('20.Qe3');
  await at(2.0); await step(app, "theirMove('d7','e6')");               // 20...Be6, eyeing a2
  await at(2.5); await step(app, 'strikeYou()');                         // it lands: zaki's bar is empty
  await sleep(1500); await DEBUG(app, '1-broken');
  await at(5.2); await step(app, "theirMove('d1','c1')");               // the stolen turn: 21.Rc1, walling in zaki's king
  await sleep(600); await DEBUG(app, '2-stolen');
  await at(6.4); await step(app, "theirMate('a5','a2')");               // 21...Qxa2#, with its result
  await sleep(2500); await DEBUG(app, '3-mate');
  await at(CUT); await DEBUG(app, '4-card'); app.camera.cut();
  console.log('end', await app.eval('JSON.stringify(window.__demo.health())'));
});
poster('fall', list, 0.1);                                           // the first frame: the clip starts from it in view
console.log('frames', list.length, 'seconds', (list.length / 30).toFixed(1));
