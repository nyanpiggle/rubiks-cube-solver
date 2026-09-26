import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { Cube, initSolver, solve } from "rubik-solver";
import {
  applyAlg,
  applyMove,
  decideTurn,
  invertMove,
  isSolved,
  randomScramble,
  solvedPieces,
  toFaceletString,
} from "./engine.ts";

function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

describe("cube engine", () => {
  before(() => {
    initSolver();
  });
  it("matches a solved cube", () => {
    assert.equal(toFaceletString(solvedPieces()), new Cube().asString());
  });

  it("matches the solver's move tables", () => {
    const singles = ["U", "R", "F", "D", "L", "B", "M", "E", "S"].flatMap((face) => [
      face,
      `${face}'`,
      `${face}2`,
    ]);
    for (const move of singles) {
      const ours = toFaceletString(applyMove(solvedPieces(), move));
      const theirs = new Cube().move(move).asString();
      assert.equal(ours, theirs, move);
    }
  });

  it("stays aligned across random algorithms", () => {
    for (let n = 0; n < 40; n++) {
      const alg = randomScramble(24, lcg(n + 1)).join(" ");
      const ours = toFaceletString(applyAlg(solvedPieces(), alg));
      const cube = new Cube().move(alg);
      assert.equal(ours, cube.asString(), alg);
      assert.equal(cube.verify(), true);
    }
  });

  it("inverts", () => {
    let pieces = solvedPieces();
    const moves = ["R", "U", "F'", "D2", "L", "B'", "M", "E'", "S2"];
    for (const move of moves) pieces = applyMove(pieces, move);
    for (const move of [...moves].reverse()) pieces = applyMove(pieces, invertMove(move));
    assert.equal(isSolved(pieces), true);
  });

  it("reads swipes", () => {
    assert.equal(decideTurn("F", { x: 0, y: 1, z: 1 }, { x: 1, y: 0, z: 0 }), "U'");
    assert.equal(decideTurn("F", { x: 1, y: 0, z: 1 }, { x: 0, y: 1, z: 0 }), "R");
    assert.equal(decideTurn("F", { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 }), "E");
    assert.equal(decideTurn("F", { x: 0, y: -1, z: 1 }, { x: 1, y: 0, z: 0 }), "D");
  });
});

describe("kociemba", () => {
  it("solves scrambled states back to solved", () => {
    initSolver();
    for (let n = 0; n < 6; n++) {
      const alg = randomScramble(22, lcg(100 + n)).join(" ");
      const scrambled = applyAlg(solvedPieces(), alg);
      const cube = Cube.fromString(toFaceletString(scrambled));
      assert.equal(cube.verify(), true, alg);
      const solution = solve(cube);
      assert.ok(solution, `no solution for ${alg}`);
      const restored = applyAlg(scrambled, solution!);
      assert.equal(isSolved(restored), true, `${alg} => ${solution}`);
    }
  });
});
