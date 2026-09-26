# Agent guide

`AGENTS.md` and `CLAUDE.md` are the same document. Read this before editing.

## What this repo is

Two solvers for a 3×3, side by side. Do not delete either.

- **Quarter** is the browser bench: `src/lib/cube`, `src/components/cube`, `src/routes`. Swipe a row or column, scramble, play a Kociemba solution (at most 22 turns) from `rubik-solver` in a worker.
- **Python** is the original model: `cube.py`, `moves.py`, `solver.py`, `utils.py`, `main.py`, mirrored under `src/`, with tests in `tests/` and `test_*.py`. Those paths belong to Python. TypeScript must not take them.

## Why the phone tile opens the cube

The home-screen list is not this repo. It is [app-hub](https://github.com/nyanpiggle/app-hub), published at <https://nyanpiggle.github.io/app-hub/>. That page asks GitHub for nyanpiggle’s public repos and draws one card each. `app-hub` itself is skipped. Private repos never appear (there is no token in the page).

A card does not open the GitHub source if a live site exists. The link is, in order:

1. the repo’s Homepage / website URL, if set
2. otherwise `https://nyanpiggle.github.io/<repo>/` when GitHub Pages is on
3. otherwise the GitHub repo

This repo’s website is <https://nyanpiggle.github.io/rubiks-cube-solver/>, and Pages is deployed from the `gh-pages` branch. That is why the **rubiks-cube-solver** card opens Quarter.

Leave all three of these alone unless you are deliberately changing the publish:

- GitHub Pages source: branch `gh-pages`, folder `/`
- Repository website: `https://nyanpiggle.github.io/rubiks-cube-solver/`
- `gh-pages` contents: the static client build, not the Python tree and not `main`

Clearing the website, turning Pages off, or making the repo private makes the card open GitHub (or disappear). Do not force-push `main`.

## Publish Quarter again

Only when the web app changed. `main` is the source. `gh-pages` is the site.

```bash
GITHUB_PAGES=1 npm run build:pages
cp dist/client/index.html dist/client/404.html
touch dist/client/.nojekyll
```

Push the contents of `dist/client/` to `gh-pages`. `GITHUB_PAGES=1` sets Vite’s base to `/rubiks-cube-solver/` and prerenders `/` to `dist/client/index.html`. Without that flag the asset URLs are wrong on the user site and the page is blank. Do not commit `dist/`, `node_modules/`, or `.env`.

## Cube model — do not “fix” the turn signs

Axes: +Y up, +X right, +Z front. Facelet string order is URFDLB, matching `rubik-solver`. Colors: U white, D yellow, F green, B blue, R red, L orange.

`R` is a negative quarter-turn about X (`BASE` in `src/lib/cube/engine.ts`). A positive X turn is `R'`. Flipping those signs looks tidy and is wrong: the library’s R is the clockwise face turn. `src/lib/cube/engine.test.ts` checks single moves, inverses, and solves against `rubik-solver` after `initSolver()`. Run it before and after any change to `engine.ts`.

Swipes are not “turn the face you touched.” `decideTurn` turns the row or column under the finger so that cubie follows the drag. Orbit is empty space only.
