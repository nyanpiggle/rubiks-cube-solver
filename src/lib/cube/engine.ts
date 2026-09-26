export type Face = "U" | "R" | "F" | "D" | "L" | "B";
export type Axis = "x" | "y" | "z";
export type Coord = -1 | 0 | 1;
export type SliceFace = Face | "M" | "E" | "S";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Piece {
  id: number;
  x: Coord;
  y: Coord;
  z: Coord;
  /** Color sitting on each outward direction. */
  stickers: Partial<Record<Face, Face>>;
}

export interface MoveSpec {
  notation: string;
  face: SliceFace;
  axis: Axis;
  layer: Coord;
  /** +1 is a right-handed quarter turn. */
  sign: 1 | -1;
  turns: 1 | 2;
}

export const FACES: Face[] = ["U", "R", "F", "D", "L", "B"];

export const SOLVED_FACELETS = FACES.map((face) => face.repeat(9)).join("");

const DIR: Record<Face, { x: Coord; y: Coord; z: Coord }> = {
  R: { x: 1, y: 0, z: 0 },
  L: { x: -1, y: 0, z: 0 },
  U: { x: 0, y: 1, z: 0 },
  D: { x: 0, y: -1, z: 0 },
  F: { x: 0, y: 0, z: 1 },
  B: { x: 0, y: 0, z: -1 },
};

const BASE: Record<SliceFace, { axis: Axis; layer: Coord; sign: 1 | -1 }> = {
  R: { axis: "x", layer: 1, sign: -1 },
  L: { axis: "x", layer: -1, sign: 1 },
  M: { axis: "x", layer: 0, sign: 1 },
  U: { axis: "y", layer: 1, sign: -1 },
  D: { axis: "y", layer: -1, sign: 1 },
  E: { axis: "y", layer: 0, sign: 1 },
  F: { axis: "z", layer: 1, sign: -1 },
  B: { axis: "z", layer: -1, sign: 1 },
  S: { axis: "z", layer: 0, sign: -1 },
};

function coord(n: number): Coord {
  return Math.round(n) as Coord;
}

function rot90(v: Vec3, axis: Axis, sign: 1 | -1): { x: Coord; y: Coord; z: Coord } {
  let { x, y, z } = v;
  const times = sign === 1 ? 1 : 3;
  for (let i = 0; i < times; i++) {
    if (axis === "x") {
      const ny = -z;
      const nz = y;
      y = ny;
      z = nz;
    } else if (axis === "y") {
      const nx = z;
      const nz = -x;
      x = nx;
      z = nz;
    } else {
      const nx = -y;
      const ny = x;
      x = nx;
      y = ny;
    }
  }
  return { x: coord(x), y: coord(y), z: coord(z) };
}

function faceOf(v: { x: number; y: number; z: number }): Face {
  if (v.x === 1) return "R";
  if (v.x === -1) return "L";
  if (v.y === 1) return "U";
  if (v.y === -1) return "D";
  if (v.z === 1) return "F";
  return "B";
}

function rotateStickers(
  stickers: Partial<Record<Face, Face>>,
  axis: Axis,
  sign: 1 | -1,
): Partial<Record<Face, Face>> {
  const next: Partial<Record<Face, Face>> = {};
  for (const face of FACES) {
    const color = stickers[face];
    if (!color) continue;
    next[faceOf(rot90(DIR[face], axis, sign))] = color;
  }
  return next;
}

export function solvedPieces(): Piece[] {
  const pieces: Piece[] = [];
  let id = 0;
  for (const y of [-1, 0, 1] as Coord[]) {
    for (const z of [-1, 0, 1] as Coord[]) {
      for (const x of [-1, 0, 1] as Coord[]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const stickers: Partial<Record<Face, Face>> = {};
        if (x === 1) stickers.R = "R";
        if (x === -1) stickers.L = "L";
        if (y === 1) stickers.U = "U";
        if (y === -1) stickers.D = "D";
        if (z === 1) stickers.F = "F";
        if (z === -1) stickers.B = "B";
        pieces.push({ id: id++, x, y, z, stickers });
      }
    }
  }
  return pieces;
}

export function parseMove(raw: string): MoveSpec {
  const notation = raw.trim();
  const face = notation[0] as SliceFace;
  const spec = BASE[face];
  if (!spec || notation.length > 2) throw new Error(`Invalid move: ${raw}`);
  const mod = notation.slice(1);
  if (mod !== "" && mod !== "'" && mod !== "2") throw new Error(`Invalid move: ${raw}`);
  const prime = mod === "'";
  const sign = (prime ? -spec.sign : spec.sign) as 1 | -1;
  return {
    notation,
    face,
    axis: spec.axis,
    layer: spec.layer,
    sign,
    turns: mod === "2" ? 2 : 1,
  };
}

export function invertMove(notation: string): string {
  if (notation.endsWith("2")) return notation;
  if (notation.endsWith("'")) return notation.slice(0, -1);
  return `${notation}'`;
}

export function tokenize(alg: string): string[] {
  return alg.trim().split(/\s+/).filter(Boolean);
}

export function applyMove(pieces: Piece[], notation: string): Piece[] {
  const spec = parseMove(notation);
  let current = pieces;
  for (let turn = 0; turn < spec.turns; turn++) {
    current = current.map((piece) => {
      const onLayer =
        spec.axis === "x"
          ? piece.x === spec.layer
          : spec.axis === "y"
            ? piece.y === spec.layer
            : piece.z === spec.layer;
      if (!onLayer) return piece;
      const next = rot90(piece, spec.axis, spec.sign);
      return {
        id: piece.id,
        ...next,
        stickers: rotateStickers(piece.stickers, spec.axis, spec.sign),
      };
    });
  }
  return current;
}

export function applyAlg(pieces: Piece[], alg: string): Piece[] {
  return tokenize(alg).reduce(applyMove, pieces);
}

/** Facelet index order matches the solver: U R F D L B, reading order on each face. */
export function faceletSlots(face: Face): { x: Coord; y: Coord; z: Coord }[] {
  const slots: { x: Coord; y: Coord; z: Coord }[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (face === "U") slots.push({ x: coord(col - 1), y: 1, z: coord(row - 1) });
      else if (face === "R") slots.push({ x: 1, y: coord(1 - row), z: coord(1 - col) });
      else if (face === "F") slots.push({ x: coord(col - 1), y: coord(1 - row), z: 1 });
      else if (face === "D") slots.push({ x: coord(col - 1), y: -1, z: coord(1 - row) });
      else if (face === "L") slots.push({ x: -1, y: coord(1 - row), z: coord(col - 1) });
      else slots.push({ x: coord(1 - col), y: coord(1 - row), z: -1 });
    }
  }
  return slots;
}

export function toFaceletString(pieces: Piece[]): string {
  let out = "";
  for (const face of FACES) {
    for (const slot of faceletSlots(face)) {
      const piece = pieces.find((p) => p.x === slot.x && p.y === slot.y && p.z === slot.z);
      const color = piece?.stickers[face];
      if (!color) throw new Error(`Missing sticker at ${face} ${slot.x},${slot.y},${slot.z}`);
      out += color;
    }
  }
  return out;
}

export function readFaces(pieces: Piece[]): Record<Face, Face[]> {
  const faces = {} as Record<Face, Face[]>;
  for (const face of FACES) {
    faces[face] = faceletSlots(face).map((slot) => {
      const piece = pieces.find((p) => p.x === slot.x && p.y === slot.y && p.z === slot.z);
      const color = piece?.stickers[face];
      if (!color) throw new Error("Missing sticker");
      return color;
    });
  }
  return faces;
}

export function isSolved(pieces: Piece[]): boolean {
  return toFaceletString(pieces) === SOLVED_FACELETS;
}

const OPPOSITE: Record<Face, Face> = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };

/** WCA-style random-move scramble. Not a uniform random state; fine as a hand scramble. */
export function randomScramble(length = 20, random = Math.random): string[] {
  const mods = ["", "'", "2"];
  const out: string[] = [];
  let prev: Face | null = null;
  let prev2: Face | null = null;
  while (out.length < length) {
    const face = FACES[Math.floor(random() * FACES.length)]!;
    if (face === prev) continue;
    if (prev && prev2 && face === prev2 && OPPOSITE[face] === prev) continue;
    const mod = mods[Math.floor(random() * mods.length)]!;
    out.push(face + mod);
    prev2 = prev;
    prev = face;
  }
  return out;
}

function moveFromAxis(axis: Axis, layer: Coord, sign: 1 | -1): string {
  if (axis === "x") {
    if (layer === 1) return sign === -1 ? "R" : "R'";
    if (layer === -1) return sign === 1 ? "L" : "L'";
    return sign === 1 ? "M" : "M'";
  }
  if (axis === "y") {
    if (layer === 1) return sign === -1 ? "U" : "U'";
    if (layer === -1) return sign === 1 ? "D" : "D'";
    return sign === 1 ? "E" : "E'";
  }
  if (layer === 1) return sign === -1 ? "F" : "F'";
  if (layer === -1) return sign === 1 ? "B" : "B'";
  return sign === -1 ? "S" : "S'";
}

/**
 * Swipe model: drag a row or column on the face you touched.
 * The layer that contains that cubie, perpendicular to the drag, turns so the cubie follows the finger.
 */
export function decideTurn(normal: Face, piece: { x: Coord; y: Coord; z: Coord }, drag: Vec3): string | null {
  const n = DIR[normal];
  const nd = drag.x * n.x + drag.y * n.y + drag.z * n.z;
  const dx = drag.x - n.x * nd;
  const dy = drag.y - n.y * nd;
  const dz = drag.z - n.z * nd;
  const comps: { axis: Axis; v: number }[] = [];
  if (n.x === 0) comps.push({ axis: "x", v: dx });
  if (n.y === 0) comps.push({ axis: "y", v: dy });
  if (n.z === 0) comps.push({ axis: "z", v: dz });
  comps.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const best = comps[0];
  const second = comps[1];
  if (!best || !second) return null;
  if (Math.abs(best.v) < Math.abs(second.v) * 1.35) return null;

  const dragDir = { x: 0, y: 0, z: 0 };
  dragDir[best.axis] = Math.sign(best.v) || 1;

  let ax = n.y * dragDir.z - n.z * dragDir.y;
  let ay = n.z * dragDir.x - n.x * dragDir.z;
  let az = n.x * dragDir.y - n.y * dragDir.x;
  const mx = ay * piece.z - az * piece.y;
  const my = az * piece.x - ax * piece.z;
  const mz = ax * piece.y - ay * piece.x;
  const align = mx * dragDir.x + my * dragDir.y + mz * dragDir.z;
  if (align < 0) {
    ax = -ax;
    ay = -ay;
    az = -az;
  }
  const axA = Math.abs(ax);
  const ayA = Math.abs(ay);
  const azA = Math.abs(az);
  let axis: Axis;
  let sign: 1 | -1;
  if (axA >= ayA && axA >= azA) {
    axis = "x";
    sign = ax >= 0 ? 1 : -1;
  } else if (ayA >= azA) {
    axis = "y";
    sign = ay >= 0 ? 1 : -1;
  } else {
    axis = "z";
    sign = az >= 0 ? 1 : -1;
  }
  const layer = (axis === "x" ? piece.x : axis === "y" ? piece.y : piece.z) as Coord;
  return moveFromAxis(axis, layer, sign);
}

export function snapNormal(v: Vec3): Face | null {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  const max = Math.max(ax, ay, az);
  if (max < 0.5) return null;
  if (ax === max) return v.x > 0 ? "R" : "L";
  if (ay === max) return v.y > 0 ? "U" : "D";
  return v.z > 0 ? "F" : "B";
}
