# Agent guide

`AGENTS.md` and `CLAUDE.md` are the same document. Read this before editing.

## Phone list (all nyanpiggle projects)

The home screen is <https://nyanpiggle.github.io/app-hub/>, repo [app-hub](https://github.com/nyanpiggle/app-hub). It lists public repos that are not forks. `app-hub` itself is not a card. Private repos never appear.

A card opens, in order:

1. the repo Homepage / website URL, if one is set
2. otherwise `https://nyanpiggle.github.io/<repo>/` when GitHub Pages is on
3. otherwise the GitHub repo, which is the source, not the app

A change to an app is not finished when its source branch moves. The same turn must update the URL that card opens, then confirm the live page is the new one. Do not clear Homepage, turn Pages off, or make the repo private if it should stay on the phone. Repos do not all publish the same way. Use the section for this repo. Copy this phone section into `AGENTS.md` and `CLAUDE.md` on any new project.

## What this repo is

Two solvers for a 3×3, side by side. Do not delete either.

- **Quarter** is the browser bench: `src/lib/cube`, `src/components/cube`, `src/routes`. Swipe a row or column, scramble, play a Kociemba solution (at most 22 turns) from `rubik-solver` in a worker.
- **Python** is the original model: `cube.py`, `moves.py`, `solver.py`, `utils.py`, `main.py`, mirrored under `src/`, with tests in `tests/` and `test_*.py`. Those paths belong to Python. TypeScript must not take them.

## This repo on the phone

The card opens <https://nyanpiggle.github.io/rubiks-cube-solver/> because that URL is the Homepage. Pages serves the `gh-pages` branch, not `main`. Pushing `main` and stopping leaves the phone on the previous cube.

Leave these alone unless you are changing the publish on purpose:

- GitHub Pages source: branch `gh-pages`, folder `/`
- Homepage: `https://nyanpiggle.github.io/rubiks-cube-solver/`
- `gh-pages` contents: the static client build, not the Python tree and not `main`

Do not force-push `main`.

## Publish the phone link in the same turn

If you changed Quarter (anything under `src/` that the app renders, `public/`, or the Pages build), replace `gh-pages` before you say the update is done. A docs-only change (`AGENTS.md`, `CLAUDE.md`, `README.md`) does not need a rebuild.

```bash
GITHUB_PAGES=1 npm run build:pages
cp dist/client/index.html dist/client/404.html
touch dist/client/.nojekyll
```

Then replace `gh-pages` with the contents of `dist/client/` (force-push that branch only). `GITHUB_PAGES=1` sets Vite’s base to `/rubiks-cube-solver/` and prerenders `/` to `dist/client/index.html`. Without that flag the phone page is blank. Do not commit `dist/`, `node_modules/`, or `.env`. Do not merge `main` into `gh-pages`.

Done means the live page’s script URL matches the new `dist/client/index.html`. If the live HTML is still the old hash, Pages has not caught up yet. A refresh on the phone picks up the new `index.html`.

## Cube model — do not “fix” the turn signs

Axes: +Y up, +X right, +Z front. Facelet string order is URFDLB, matching `rubik-solver`. Colors: U white, D yellow, F green, B blue, R red, L orange.

`R` is a negative quarter-turn about X (`BASE` in `src/lib/cube/engine.ts`). A positive X turn is `R'`. Flipping those signs looks tidy and is wrong: the library’s R is the clockwise face turn. `src/lib/cube/engine.test.ts` checks single moves, inverses, and solves against `rubik-solver` after `initSolver()`. Run it before and after any change to `engine.ts`.

Swipes are not “turn the face you touched.” `decideTurn` turns the row or column under the finger so that cubie follows the drag. Orbit is empty space only.
