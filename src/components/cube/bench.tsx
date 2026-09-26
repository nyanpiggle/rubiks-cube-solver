import { Copy, Pause, Play, RotateCcw, Shuffle, SkipForward, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FACES, isSolved, toFaceletString, tokenize, type Face } from "@/lib/cube/engine";
import { useCube, type Speed } from "@/lib/cube/store";
import { DIST_MAX, DIST_MIN, PITCH_MAX, PITCH_MIN, useView } from "@/lib/cube/view";
import { CubeNet } from "./net";
import { CubeStage } from "./cube-stage";

const SPEEDS: Speed[] = [1, 2, 4];

function wrapDegrees(radians: number): number {
  const degrees = (radians * 180) / Math.PI;
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

function ViewControls() {
  const yaw = useView((s) => s.yaw);
  const pitch = useView((s) => s.pitch);
  const distance = useView((s) => s.distance);
  const zoomed = Math.round(((DIST_MAX - distance) / (DIST_MAX - DIST_MIN)) * 1000);
  const pitchDeg = (pitch * 180) / Math.PI;
  return (
    <div className="view-controls">
      <label className="view-row">
        <span>Zoom</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={zoomed}
          aria-label="Zoom. Left shows the whole cube, right moves closer."
          onChange={(event) => {
            const t = Number(event.target.value) / 1000;
            useView.getState().setDistance(DIST_MAX - t * (DIST_MAX - DIST_MIN));
          }}
        />
      </label>
      <label className="view-row">
        <span>Yaw</span>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={Math.round(wrapDegrees(yaw))}
          aria-label="Yaw. Rotates the whole cube left and right."
          onChange={(event) => useView.getState().setYaw((Number(event.target.value) * Math.PI) / 180)}
        />
      </label>
      <label className="view-row">
        <span>Pitch</span>
        <input
          type="range"
          min={Math.round((PITCH_MIN * 180) / Math.PI)}
          max={Math.round((PITCH_MAX * 180) / Math.PI)}
          step={1}
          value={Math.round(pitchDeg)}
          aria-label="Pitch. Tips the whole cube up and down. No tilt."
          onChange={(event) => useView.getState().setPitch((Number(event.target.value) * Math.PI) / 180)}
        />
      </label>
    </div>
  );
}

export function Bench() {
  const history = useCube((s) => s.history);
  const solution = useCube((s) => s.solution);
  const cursor = useCube((s) => s.cursor);
  const mode = useCube((s) => s.mode);
  const locked = useCube((s) => s.locked);
  const solver = useCube((s) => s.solver);
  const speed = useCube((s) => s.speed);
  const message = useCube((s) => s.message);
  const pieces = useCube((s) => s.pieces);
  const solved = isSolved(pieces);
  const busy = locked || mode !== "idle";
  const [searching, setSearching] = useState(false);
  const request = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, { resolve: (value: string | null) => void; reject: (error: Error) => void }>());
  const tapeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../../lib/cube/solver.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ type: string; id?: number; result?: string | null; error?: string }>) => {
      if (event.data.type === "ready") {
        useCube.getState().setSolver("ready");
        return;
      }
      if (event.data.type !== "result" || event.data.id === undefined) return;
      const job = pending.current.get(event.data.id);
      if (!job) return;
      pending.current.delete(event.data.id);
      if (event.data.error) job.reject(new Error(event.data.error));
      else job.resolve(event.data.result ?? null);
    };
    worker.onerror = () => useCube.getState().setSolver("error");
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Space") {
        if (event.target instanceof HTMLButtonElement) return;
        event.preventDefault();
        const state = useCube.getState();
        if (state.mode === "playback") state.pause();
        else state.play();
        return;
      }
      if (event.code === "KeyZ" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        useCube.getState().undo();
        return;
      }
      const face = event.key.toUpperCase();
      if (!FACES.includes(face as Face)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      const notation = event.shiftKey ? `${face}'` : face;
      useCube.getState().enqueue([notation]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const current = tapeRef.current?.querySelector<HTMLElement>("[data-current='true']");
    current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [cursor, solution]);

  async function onSolve() {
    const state = useCube.getState();
    if (state.solver !== "ready" || state.locked || state.mode !== "idle" || searching) return;
    if (isSolved(state.pieces)) return;
    const id = ++request.current;
    setSearching(true);
    useCube.getState().setMessage(null);
    try {
      const alg = await new Promise<string | null>((resolve, reject) => {
        const job = request.current;
        pending.current.set(job, { resolve, reject });
        workerRef.current?.postMessage({ id: job, facelets: toFaceletString(useCube.getState().pieces) });
      });
      if (id !== request.current) return;
      if (!alg) {
        useCube.getState().setMessage("No solution within 22 turns.");
        return;
      }
      useCube.getState().setSolution(tokenize(alg));
      useCube.getState().play();
    } catch (error) {
      if (id !== request.current) return;
      useCube.getState().setMessage(error instanceof Error ? error.message : "Solve failed");
    } finally {
      if (id === request.current) setSearching(false);
    }
  }

  function onScramble() {
    request.current += 1;
    setSearching(false);
    if (mode === "scramble") useCube.getState().pause();
    else useCube.getState().scramble();
  }

  async function onCopy() {
    const alg = solution?.join(" ");
    if (!alg) return;
    try {
      await navigator.clipboard.writeText(alg);
      useCube.getState().setMessage("Solution copied");
    } catch {
      useCube.getState().setMessage("Couldn't copy");
    }
  }

  const tape = solution ?? history.slice(-18);
  const tapeLabel = solution ? "Solution" : "Turns";
  const status =
    solver === "booting"
      ? "Building pruning tables"
      : solver === "error"
        ? "Solver failed to start"
        : searching
          ? "Searching"
          : mode === "scramble"
            ? "Scrambling"
            : mode === "playback"
              ? "Solving"
              : solved
                ? "Solved"
                : "Ready to solve";

  const canManual = !busy && !searching;

  return (
    <main className="bench">
      <CubeStage />
      <section className="panel">
        <header className="mast">
          <p className="kicker">Cube bench</p>
          <h1>Quarter</h1>
          <p className="lede">
            Swipe a row or column. Kociemba's two-phase search puts it back in twenty turns or fewer.
          </p>
        </header>

        <div className="status-row">
          <p className="status" role="status">
            {status}
          </p>
          <p className="count tabular-nums">
            <span>{history.length}</span>
            <span className="count-label">turns</span>
          </p>
        </div>

        <CubeNet />

        <div className="tape-block">
          <div className="tape-head">
            <span>{tapeLabel}</span>
            {solution ? (
              <span className="tabular-nums">
                {Math.min(cursor, solution.length)}/{solution.length}
              </span>
            ) : null}
          </div>
          <div className="tape" ref={tapeRef}>
            {tape.length === 0 ? <span className="tape-empty">No turns yet</span> : null}
            {tape.map((move, index) => {
              const absolute = solution ? index : history.length - tape.length + index;
              const current = Boolean(solution) && index === cursor && cursor < (solution?.length ?? 0);
              const done = Boolean(solution) && index < cursor;
              return (
                <span
                  key={`${absolute}-${move}`}
                  data-current={current ? "true" : "false"}
                  className={`chip${done ? " is-done" : ""}${current ? " is-current" : ""}`}
                >
                  {move}
                </span>
              );
            })}
          </div>
          {message ? <p className="note">{message}</p> : null}
        </div>

        <div className="action-row">
          <button type="button" className="btn btn-primary" onClick={() => void onSolve()} disabled={!canManual || solved || solver !== "ready"}>
            {searching ? "Searching" : solved ? "Solved" : "Solve"}
          </button>
          <button type="button" className="btn" onClick={onScramble} disabled={locked && mode !== "scramble"}>
            <Shuffle aria-hidden="true" />
            {mode === "scramble" ? "Stop" : "Scramble"}
          </button>
        </div>

        <div className="tool-row">
          <button
            type="button"
            className="icon-btn"
            aria-label={mode === "playback" ? "Pause" : "Play solution"}
            disabled={!solution || cursor >= (solution?.length ?? 0) || (busy && mode !== "playback") || searching}
            onClick={() => (mode === "playback" ? useCube.getState().pause() : useCube.getState().play())}
          >
            {mode === "playback" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Step"
            disabled={!solution || busy || searching || cursor >= (solution?.length ?? 0)}
            onClick={() => useCube.getState().step()}
          >
            <SkipForward aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" aria-label="Undo" disabled={!canManual || history.length === 0} onClick={() => useCube.getState().undo()}>
            <Undo2 aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" aria-label="Reset" onClick={() => { request.current += 1; setSearching(false); useCube.getState().reset(); }}>
            <RotateCcw aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" aria-label="Copy solution" disabled={!solution} onClick={() => void onCopy()}>
            <Copy aria-hidden="true" />
          </button>
          <div className="speed" role="group" aria-label="Playback speed">
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={speed === value}
                onClick={() => useCube.getState().setSpeed(value)}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>

        <ViewControls />

        <div className="pad" aria-label="Face turns">
          {FACES.map((face) => (
            <div key={face} className="pad-col">
              <button type="button" disabled={!canManual} onClick={() => useCube.getState().enqueue([face])}>
                {face}
              </button>
              <button type="button" disabled={!canManual} onClick={() => useCube.getState().enqueue([`${face}'`])}>
                {face}'
              </button>
              <button type="button" disabled={!canManual} onClick={() => useCube.getState().enqueue([`${face}2`])}>
                {face}2
              </button>
            </div>
          ))}
        </div>

        <p className="hint">One finger turns a row or column. Two fingers yaw and pitch the whole cube. Keys U R F D L B, Shift for prime, Z undo, Space plays.</p>
      </section>
    </main>
  );
}
