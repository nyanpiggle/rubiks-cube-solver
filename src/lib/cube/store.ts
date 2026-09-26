import { create } from "zustand";
import {
  applyMove,
  invertMove,
  isSolved,
  randomScramble,
  solvedPieces,
  type Piece,
} from "./engine";

export type SolverStatus = "booting" | "ready" | "error";
export type PlayMode = "idle" | "scramble" | "playback";
export type Speed = 1 | 2 | 4;

interface CubeState {
  pieces: Piece[];
  history: string[];
  queue: string[];
  solution: string[] | null;
  cursor: number;
  mode: PlayMode;
  locked: boolean;
  solver: SolverStatus;
  speed: Speed;
  message: string | null;
  epoch: number;
  enqueue: (moves: string[]) => void;
  commit: (move: string) => void;
  scramble: () => void;
  reset: () => void;
  undo: () => void;
  play: () => void;
  pause: () => void;
  step: () => void;
  setSpeed: (speed: Speed) => void;
  setSolver: (solver: SolverStatus) => void;
  setSolution: (moves: string[]) => void;
  setMessage: (message: string | null) => void;
  setLocked: (locked: boolean) => void;
}

export const useCube = create<CubeState>((set, get) => ({
  pieces: solvedPieces(),
  history: [],
  queue: [],
  solution: null,
  cursor: 0,
  mode: "idle",
  locked: false,
  solver: "booting",
  speed: 1,
  message: null,
  epoch: 0,

  enqueue: (moves) => {
    const state = get();
    if (state.locked || state.mode !== "idle" || moves.length === 0) return;
    set({ queue: [...state.queue, ...moves], solution: null, cursor: 0, message: null });
  },

  commit: (move) => {
    const state = get();
    const pieces = applyMove(state.pieces, move);
    let cursor = state.cursor;
    if (state.solution && state.solution[cursor] === move) cursor += 1;
    set({
      pieces,
      history: [...state.history, move],
      cursor,
      message: isSolved(pieces) ? null : state.message,
    });
  },

  scramble: () => {
    const state = get();
    if (state.locked || state.mode !== "idle") return;
    set({
      queue: randomScramble(20),
      mode: "scramble",
      solution: null,
      cursor: 0,
      message: null,
    });
  },

  reset: () => {
    set({
      pieces: solvedPieces(),
      history: [],
      queue: [],
      solution: null,
      cursor: 0,
      mode: "idle",
      locked: false,
      message: null,
      epoch: get().epoch + 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.locked || state.mode !== "idle" || state.history.length === 0) return;
    const last = state.history[state.history.length - 1]!;
    set({
      pieces: applyMove(state.pieces, invertMove(last)),
      history: state.history.slice(0, -1),
      solution: null,
      cursor: 0,
      message: null,
    });
  },

  setSolution: (moves) => set({ solution: moves, cursor: 0, message: null }),

  play: () => {
    const state = get();
    if (!state.solution || state.locked || state.mode !== "idle") return;
    const rest = state.solution.slice(state.cursor);
    if (rest.length === 0) return;
    set({ queue: rest, mode: "playback" });
  },

  pause: () => set({ queue: [], mode: "idle" }),

  step: () => {
    const state = get();
    if (!state.solution || state.locked || state.mode !== "idle") return;
    const move = state.solution[state.cursor];
    if (!move) return;
    set({ queue: [move], mode: "playback" });
  },

  setSpeed: (speed) => set({ speed }),
  setSolver: (solver) => set({ solver }),
  setMessage: (message) => set({ message }),
  setLocked: (locked) => set({ locked }),
}));
