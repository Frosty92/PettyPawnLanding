# PettyPawn landing page

Static page: `index.html`, `styles.css`, `main.js`, `assets/`. Serve it with the `pp-landing` entry in `.claude/launch.json` (port 8796) or any static server. Plan: `PettyPawn/docs/exec-plans/active/2026-10-25_pp-landing-page-and-demo-video.md`.

- **Copy:** the founder's words, in his order. The hero (2026-10-26): "The Most Unhinged Chess Game Ever Made", then the support text, which opens "Welcome to Petty Pawn Park!", ends on stealing "your beloved pet" and the dare "Think you can hang?", and the battle clip. Next comes the arrival story (2026-10-26: the relaxing chess you came for, "Chess is all about respect, after all, right?", a slammed **WRONG.**, then "absolute mayhem"), which leads into the story clip. Under that, since 2026-10-26, "PettyPawn is chess with No Chill." says what the game is at a high level: real chess against other players, coins, The Petty Match and the grudge it starts (The Petty Rematch or the ransom), the enemies you make, "Can you handle the heat?" (both dares are set in the graffiti display face, in Cone); its picture is the Petty Match walk-out (`assets/video/walkout.jpg`). Then Most Wanted and the closer (2026-10-25). Change the copy only with his words.
- **Look:** Lamplight, the app's look since 2026-10-25 (`PettyPawn/docs/product/hoodblitz-design.md` → Lamplight): the lawn's gradient with a pool of warm lamplight per section, green cards and frames, Chalk, Tennis Ball for actions, Cone for the stake; Sedgwick Ave Display, Sedgwick Ave, Anton and Barlow (OFL, in `assets/fonts`); the live logo, The Smack, Turf (`assets/brand`).
- **The line-up** (out of the hero since 2026-10-26, "too extra" for now; the files stay for later): every breed is drawn by the app's own pet engine. `brand/render-pets.ts` writes `assets/pets/<breed>.svg` (on the charcoal portrait) and `<breed>-bare.svg` (no backdrop). Run it from `PettyPawn/`: `npx tsx ../pp-landing/brand/render-pets.ts ../pp-landing/assets/pets`. The hero uses the Doberman, Pug, Chihuahua, Persian and Corgi; phones show the middle three.
- **The battle clip** in the hero (`assets/video/battle.mp4`, poster `battle.jpg`) is PettyPawn's Studio battle (`/studio-combat?demo=battle`, `PettyPawn/src/studio/demoFight.ts`), filmed by `capture/battle.mjs`. It runs 10 s, at 780 × 1688, muted.
  - Who: zaki's Doberman (you) against frosty's Chihuahua, in a Dragon.
  - What happens: frosty's taunt arrives, zaki blocks a smack and lands one, then frosty's next smack lands. Both bars drain, at the live amount of blood.
- **The story clip** under the arrival story (`assets/video/fall.mp4`, poster `fall.jpg`, its first frame) is the same game a few moves on (`/studio-combat?demo=fall`), filmed by `capture/fall.mjs`. It runs 13.7 s.
  - What happens: frosty's smack empties zaki's bar (BROKEN.), frosty steals zaki's turn and plays Rc1 for zaki, and Qxa2 is mate. The card reads FROSTY HAS STOLEN YOUR PET. over zaki's shocked Doberman, as in the live game since 2026-10-26.
  - Each clip plays while most of it is on screen and rests otherwise (`main.js`), so the story clip starts from its first frame.
- **The stolen-pet still** (`assets/screens/pawned.jpg`, round four's YOU GOT PAWNED card) is no longer on the page and is kept for cleanup. `capture/pawned.mjs` re-captures the card from Studio → Result cards (`/studio-results?demo=1&you=zaki`), now titled WARLORD HAS STOLEN YOUR PET.
- **The round-one fight** (`assets/video/fight.mp4`, `fight.jpg`, from `/studio-combat?demo=1` by `capture/demo.mjs`) is no longer on the page. It is kept for cleanup. Its walk-out still (`walkout.jpg`: BOTH PETS ARE ON THE LINE, frosty's Chihuahua against zaki's Doberman) is the No Chill section's picture.
- **The Board** (`assets/screens/board.jpg`) is Studio's Most Wanted (`/studio-wall`), captured by `capture/board.mjs`.
- **Store links:** every `a.store` has `href="#"`; set the real App Store and Google Play URLs there (two in the hero, two in the closer). The footer's Privacy, Terms and Support links are also `#`.

## Re-recording

1. Start the app on web: `pettypawn-web-8086` in `.claude/launch.json`.
2. Build the helpers once, outside the project: `swiftc -O capture/encode.swift -o "$SCRATCH/encode"`, and the same for `sheet.swift`.
3. The battle clip: `cd capture && SCRATCH=… ENCODER=$SCRATCH/encode node battle.mjs`; the story clip the same way with `fall.mjs` (`CUT=` sets its end, 13.6 s by default). `DEBUG=1` saves a still at each beat. The old fight is `node demo.mjs`; add `&blood=0` to a Studio path for a clip without blood.
4. The Board: `node capture/board.mjs "$SCRATCH" /studio-wall assets/screens/board.jpg`. The stolen-pet card as a still: `node capture/pawned.mjs "$SCRATCH" assets/screens/pawned.jpg`.
5. `"$SCRATCH/sheet" "$SCRATCH/fight.txt" out.jpg 0.5` lays a take out as a contact sheet.

`?snap=story|no-chill|most-wanted|get` shows that section at the top of the page, for headless screenshots.

## Deploying

Live on Cloudflare Pages, project `pettypawn-landing` (`pettypawn-landing.pages.dev`, custom domains `pettypawn.com` and `www.pettypawn.com`). Source: github.com/Frosty92/PettyPawnLanding. `./deploy.sh` uploads only `index.html`, `styles.css`, `main.js` and `assets/`; run it from an interactive terminal where `wrangler login` works. Pushing to GitHub does not deploy by itself.
