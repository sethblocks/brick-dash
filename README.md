# Brick Dash

An original NES-style side-scrolling platformer in one self-contained `index.html` (canvas, inline JS/CSS, art drawn from code, WebAudio chiptunes).

Play: https://sethblocks.github.io/brick-dash/

* Hero: **Kit**, a courier fox delivering parcels.
* Stages: Meadow Run, Crystal Mines, Skybridge Heights, Cinder Keep (boss: **Magmus, the Cinder Mole**).
* Controls: Arrows/WASD to move, Z/Space to jump, X/Shift to run and fire, P/Enter/Esc to pause, M to mute. Touch: d-pad on the left, A (jump) and B (run/fire) on the right. Gamepads are supported too.

`src/` holds the source parts, and `src/build.sh` concatenates them into `index.html`. `test/` holds the Playwright suite (`run.js`), the level verifier (`inpage.js`) and the screenshot script (`shots.js`).
