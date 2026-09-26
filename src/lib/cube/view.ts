import { create } from "zustand";

/** Polar angle stays off the poles so the view never rolls. */
export const PITCH_MIN = 0.28;
export const PITCH_MAX = Math.PI - 0.28;
export const DIST_MIN = 4.8;
export const DIST_MAX = 18;

const START = { x: 3.2, y: 2.55, z: 3.9 };
const START_DIST = Math.hypot(START.x, START.y, START.z);

interface ViewState {
  /** Azimuth around world up. Unbounded; the slider shows it wrapped. */
  yaw: number;
  /** Polar angle from +Y. No roll. */
  pitch: number;
  /** Camera distance. Larger is zoomed out. */
  distance: number;
  setYaw: (yaw: number) => void;
  setPitch: (pitch: number) => void;
  setDistance: (distance: number) => void;
  nudge: (dx: number, dy: number, height: number) => void;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export const useView = create<ViewState>((set) => ({
  yaw: Math.atan2(START.x, START.z),
  pitch: Math.acos(START.y / START_DIST),
  distance: 9.2,
  setYaw: (yaw) => set({ yaw }),
  setPitch: (pitch) => set({ pitch: clamp(pitch, PITCH_MIN, PITCH_MAX) }),
  setDistance: (distance) => set({ distance: clamp(distance, DIST_MIN, DIST_MAX) }),
  nudge: (dx, dy, height) =>
    set((state) => {
      const k = (2 * Math.PI * 0.75) / Math.max(height, 1);
      return {
        yaw: state.yaw - dx * k,
        pitch: clamp(state.pitch - dy * k, PITCH_MIN, PITCH_MAX),
      };
    }),
}));
