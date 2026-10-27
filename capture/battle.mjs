// The hero clip (founder, 2026-10-26; PettyPawn/docs/exec-plans/active/2026-10-25_pp-landing-page-and-demo-video.md): ten
// seconds of a bloody Dragon, zaki (you) v frosty, from /studio-combat?demo=battle (PettyPawn/src/studio/demoFight.ts).
// No taunt is sent and no turn is stolen. frosty's taunt arrives; zaki takes the rook on c3; frosty plays Qa5 and smacks,
// and zaki blocks; zaki's smack lands; zaki takes on g7, frosty takes back, and frosty's next smack lands. zaki's moves,
// block and smack are taps, shown by a fingertip; frosty's are scripted. Every beat is timed from the roll.
import { take, poster, shot, sleep } from './take.mjs';
import { showTouches, press, moveBy, learnBoard } from './finger.mjs';

const TAUNT = 'are you even thinking? 😂💀';
const DEBUG = process.env.DEBUG ? (app, n) => shot(app, `${process.env.SCRATCH}/dbg-battle-${n}.jpg`, 60) : async () => {};
let ROLL = null;
const mark = (label) => console.log(ROLL ? `clip ${((Date.now() - ROLL) / 1000).toFixed(2)}` : '', label);
const step = async (app, call) => { const r = await app.eval(`window.__demo.${call}`); mark(call); return r; };
const at = (seconds) => sleep(Math.max(0, ROLL + seconds * 1000 - Date.now()));

const { list } = await take('battle', '/studio-combat?demo=battle', async (app) => {
  await showTouches(app);
  await learnBoard(app);
  await step(app, 'begin()');                                            // zaki's clock starts with the camera
  await sleep(250);
  app.camera.roll(); ROLL = Date.now();

  await at(0.2); await step(app, `taunt(${JSON.stringify(TAUNT)})`);     // frosty's word; it runs its three seconds
  await at(1.1); await moveBy(app, 'b2', 'c3'); mark('18.bxc3');
  await at(2.5); await step(app, "theirMove('d8','a5')");               // 18...Qa5
  await DEBUG(app, '1-taunt');

  await at(3.3); await step(app, 'strikeYou()');                         // his smack comes, after the taunt has run
  await at(3.55); await press(app, 'BLOCK', { exact: true }); mark('block');
  await sleep(500); await DEBUG(app, '2-blocked');

  await at(4.5); await press(app, 'Smack opponent'); mark('smack');      // zaki's smack; frosty is too slow
  await sleep(1400); await DEBUG(app, '3-landed');

  await at(6.3); await moveBy(app, 'h6', 'g7'); mark('19.Bxg7');
  await at(7.7); await step(app, "theirMove('g8','g7')");               // 19...Kxg7: two plies, his hand has cooled
  await at(8.0); await step(app, 'strikeYou()');                         // and this one lands
  await sleep(1300); await DEBUG(app, '4-smacked');
  await at(10.1); app.camera.cut();
  console.log('end', await app.eval('JSON.stringify(window.__demo.health())'));
});
poster('battle', list, 1.2);
console.log('frames', list.length, 'seconds', (list.length / 30).toFixed(1));
