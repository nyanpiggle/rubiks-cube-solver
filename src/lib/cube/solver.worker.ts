import { Cube, initSolver, solve } from "rubik-solver";

type Inbound = { id: number; facelets: string };
type Outbound =
  | { type: "ready" }
  | { type: "result"; id: number; result: string | null; error?: string };

const ctx = globalThis as unknown as {
  onmessage: ((event: MessageEvent<Inbound>) => void) | null;
  postMessage: (message: Outbound) => void;
};

initSolver();
ctx.postMessage({ type: "ready" });

ctx.onmessage = (event) => {
  const { id, facelets } = event.data;
  try {
    const cube = Cube.fromString(facelets);
    const check = cube.verify();
    if (check !== true) {
      ctx.postMessage({ type: "result", id, result: null, error: check });
      return;
    }
    ctx.postMessage({ type: "result", id, result: solve(cube) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Solve failed";
    ctx.postMessage({ type: "result", id, result: null, error: message });
  }
};
