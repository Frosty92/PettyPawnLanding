// The hero clip (founder, 2026-11-04; PettyPawn/docs/exec-plans/completed/2026-11-04_landing-demo-videos-round-two.md): about 36 seconds
// of abilities, taunts, smacks, the turn steal and the checkmate, zaki (you) v frosty, one continuous game from
// /studio-combat?demo=hero (PettyPawn/src/studio/demoFight.ts), with no zooms. A Pigeon Poop that zaki rubs off, frosty's taunt, a
// smack that zaki blocks, zaki's smack that lands, a Buzzkill that zaki swats, then frosty's Haymaker empties zaki's bar. frosty
// steals zaki's turn and plays Ng1 for zaki, taunts "The end is here. See it 😘 ?", lets it sit, and Qxf2 is mate (founder,
// 2026-11-12, PettyPawn/docs/exec-plans/active/2026-11-12_landing-clips-twilight-reshoot.md). The clip ends on the CHECKMATE
// animation, just before it fades for the game-over card. Filmed in Twilight (THEME in take.mjs).
// zaki's moves, rub, block, smack and swat are real input, shown by a fingertip; frosty's are scripted. Every beat is timed from the roll.
import { take, poster, shot, sleep } from './take.mjs';
import { showTouches, press, moveBy, learnBoard, rubOff, swatMosquito } from './finger.mjs';

const SLOW = { look: 420, slide: 420 };
// After the stolen Ng1 (STOLEN_AT) the dock says TURN STOLEN. for 5 s (TURN_STOLEN_AFTERMATH_MS, as in a live match), and a taunt
// that arrives meanwhile waits for it. frosty's last word is sent while the card is up, so it takes the dock the moment the card
// clears and shows for its 3 s (TAUNT_VISIBLE_MS). The mate comes as it goes, and the cut leaves the CHECKMATE animation 3.5 s
// after the mate, as before.
const LAST_WORD = 'The end is here. See it 😘 ?';
const STOLEN_AT = 24.9, CARD_CLEARS = STOLEN_AT + 5;
const TAUNT_AT = Number(process.env.TAUNT_AT ?? STOLEN_AT + 2.1), MATE_AT = Number(process.env.MATE_AT ?? CARD_CLEARS + 3.2);
const CUT = Number(process.env.CUT ?? MATE_AT + 3.5);
const DEBUG = process.env.DEBUG ? (app, n) => shot(app, `${process.env.SCRATCH}/dbg-battle-${n}.jpg`, 60) : async () => {};
let ROLL = null;
const mark = (label) => console.log(ROLL ? `clip ${((Date.now() - ROLL) / 1000).toFixed(2)}` : '', label);
const step = async (app, call) => { const r = await app.eval(`window.__demo.${call}`); mark(call); return r; };
const at = (seconds) => sleep(Math.max(0, ROLL + seconds * 1000 - Date.now()));

const { list } = await take('battle', '/studio-combat?demo=hero', async (app) => {
  await showTouches(app);
  await learnBoard(app);
  await step(app, 'begin()');                                            // zaki's clock starts with the camera
  await sleep(250);
  app.camera.roll(); ROLL = Date.now();

  await at(0.4); await moveBy(app, 'd2', 'd3', SLOW); mark('4.d3');
  await at(2.1); await step(app, "theirMove('d8','f6')");                // 4...Qf6, with the bishop on c5: both on f2
  await at(2.9); await step(app, "cast('pigeon_poop','e5')");            // the pigeon crosses and lets go
  await sleep(1400); await DEBUG(app, '1-pigeon');

  await at(5.3); await rubOff(app, 'e5', 1500); mark('rubbed');
  await at(7.5); await step(app, `taunt(${JSON.stringify('are you even thinking? 😂💀')})`);
  await at(8.3); await moveBy(app, 'b1', 'c3', SLOW); mark('5.Nc3');
  await at(10.0); await step(app, "theirMove('d7','d6')");               // 5...d6
  await sleep(300); await DEBUG(app, '2-taunt');

  await at(10.5); await step(app, 'hit()');                              // his smack
  await at(10.55); await press(app, 'BLOCK', { exact: true }); mark('block');
  await at(12.2); await press(app, 'Smack opponent'); mark('smack');     // zaki's smack; frosty is too slow
  await sleep(1400); await DEBUG(app, '3-landed');

  await at(14.3); await moveBy(app, 'h2', 'h3', SLOW); mark('6.h3');
  await at(15.9); await step(app, "cast('buzzkill')");                   // the mosquito
  await at(16.7); await step(app, "theirMove('c8','e6')");               // 6...Be6
  await at(17.9); await step(app, 'bite(1)');
  await at(19.9); await step(app, 'bite(2)');
  await at(20.5); await swatMosquito(app); mark('swat');

  await at(21.3); await step(app, "cast('haymaker')");
  await at(22.2); await step(app, 'hit()');                              // it lands: zaki's bar is empty, KO
  await sleep(1800); await DEBUG(app, '4-ko');
  await at(STOLEN_AT); await step(app, "theirMove('f3','g1')");          // the stolen turn: 7.Ng1, the knight off the f-file
  await sleep(600); await DEBUG(app, '5-stolen');
  // The founder's line before the mate (2026-11-12), then about three seconds for it to sink in.
  await at(TAUNT_AT); await step(app, `taunt(${JSON.stringify(LAST_WORD)})`);
  await at(CARD_CLEARS + 1.2); await DEBUG(app, '6-last-word');
  await at(MATE_AT); await step(app, "theirMate('f6','f2')");            // 7...Qxf2#, with its result
  await sleep(2500); await DEBUG(app, '7-mate');
  await at(CUT); app.camera.cut();
  console.log('end', await app.eval('JSON.stringify(window.__demo.health())'));
});
poster('battle', list, 4.0);                                             // the pigeon over the board, the splat just landed
console.log('frames', list.length, 'seconds', (list.length / 30).toFixed(1));
