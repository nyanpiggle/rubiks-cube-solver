# rubiks-cube-solver

**[Open Quarter](https://nyanpiggle.github.io/rubiks-cube-solver/)** — the cube, in the browser. No install.

Two ways to unscramble a 3×3.

## Quarter

A browser cube bench. Swipe a row or column, or use the face buttons. Scramble, then solve with Kociemba's two-phase search. The playback is at most 22 turns.

```bash
npm install
npm run dev
```

Keys: `U R F D L B`, Shift for the inverse, `Z` undo, Space plays a solution.

## Python

The original model is `cube.py`, `moves.py`, `solver.py`, and `utils.py` (mirrored under `src/`). Tests live in `tests/`.

```bash
python -m unittest discover -s tests
```
