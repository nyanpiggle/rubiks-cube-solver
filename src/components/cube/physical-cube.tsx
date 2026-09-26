import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import { decideTurn, parseMove, snapNormal, type Coord, type Face, type Piece } from "@/lib/cube/engine";
import { useCube, type Speed } from "@/lib/cube/store";
import { useView } from "@/lib/cube/view";

const SIZE = 0.94;
const STRIDE = 1.02;
const STICKER = 0.7;
const STICKER_OFFSET = SIZE / 2 + 0.012;

const AXIS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
};

const _identity = new Quaternion();
const _quat = new Quaternion();
const _pos = new Vector3();
const _pointer = new Vector2();
const _right = new Vector3();
const _up = new Vector3();
const _drag = new Vector3();
const _normal = new Vector3();

interface PieceNode {
  id: number;
  group: Group;
  body: Mesh;
  stickers: Mesh[];
}

function cssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function durationFor(notation: string, speed: Speed, reduced: boolean): number {
  if (reduced) return 0;
  const base = notation.endsWith("2") ? 0.42 : 0.28;
  return base / speed;
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

function layoutPiece(node: PieceNode, piece: Piece, materials: Record<Face, MeshStandardMaterial>) {
  node.group.position.set(piece.x * STRIDE, piece.y * STRIDE, piece.z * STRIDE);
  node.group.quaternion.identity();
  node.body.userData = { x: piece.x, y: piece.y, z: piece.z };
  const entries = Object.entries(piece.stickers) as [Face, Face][];
  entries.forEach(([dir, color], index) => {
    const mesh = node.stickers[index];
    if (!mesh) return;
    mesh.material = materials[color];
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    if (dir === "R" || dir === "L") {
      mesh.rotation.y = Math.PI / 2;
      mesh.position.x = dir === "R" ? STICKER_OFFSET : -STICKER_OFFSET;
    } else if (dir === "U" || dir === "D") {
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = dir === "U" ? STICKER_OFFSET : -STICKER_OFFSET;
    } else {
      mesh.position.z = dir === "F" ? STICKER_OFFSET : -STICKER_OFFSET;
    }
  });
}

function poseLayer(node: PieceNode, piece: Piece, active: boolean, quaternion: Quaternion) {
  _pos.set(piece.x * STRIDE, piece.y * STRIDE, piece.z * STRIDE);
  if (active) _pos.applyQuaternion(quaternion);
  node.group.position.copy(_pos);
  node.group.quaternion.copy(active ? quaternion : _identity);
}

export function PhysicalCube() {
  const root = useRef<Group>(null);
  const nodes = useRef<PieceNode[]>([]);
  const materials = useRef<Record<Face, MeshStandardMaterial> | null>(null);
  const shown = useRef<Piece[] | null>(null);
  const epochSeen = useRef(0);
  const anim = useRef<{ move: string; elapsed: number; duration: number; pieces: Piece[] } | null>(null);
  const { camera, gl } = useThree();
  const reducedRef = useRef(false);

  useLayoutEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rootGroup = root.current;
    if (!rootGroup) return;

    const colors: Record<Face, string> = {
      U: cssColor("--color-sticker-u", "#f4f1ea"),
      R: cssColor("--color-sticker-r", "#c44536"),
      F: cssColor("--color-sticker-f", "#2f7d4a"),
      D: cssColor("--color-sticker-d", "#d2ae3e"),
      L: cssColor("--color-sticker-l", "#e07a2f"),
      B: cssColor("--color-sticker-b", "#2c5fbf"),
    };
    const bodyGeo = new RoundedBoxGeometry(SIZE, SIZE, SIZE, 2, 0.075);
    const stickerGeo = new BoxGeometry(STICKER, STICKER, 0.03);
    const bodyMat = new MeshStandardMaterial({
      color: cssColor("--color-plastic", "#141210"),
      roughness: 0.4,
      metalness: 0.16,
    });
    const mats = {
      U: new MeshStandardMaterial({ color: colors.U, roughness: 0.38, metalness: 0.02 }),
      R: new MeshStandardMaterial({ color: colors.R, roughness: 0.38, metalness: 0.02 }),
      F: new MeshStandardMaterial({ color: colors.F, roughness: 0.38, metalness: 0.02 }),
      D: new MeshStandardMaterial({ color: colors.D, roughness: 0.38, metalness: 0.02 }),
      L: new MeshStandardMaterial({ color: colors.L, roughness: 0.38, metalness: 0.02 }),
      B: new MeshStandardMaterial({ color: colors.B, roughness: 0.38, metalness: 0.02 }),
    } satisfies Record<Face, MeshStandardMaterial>;
    materials.current = mats;

    const pieces = useCube.getState().pieces;
    const built = pieces.map((piece) => {
      const group = new Group();
      const body = new Mesh(bodyGeo, bodyMat);
      group.add(body);
      const stickers: Mesh[] = [];
      for (let i = 0; i < Object.keys(piece.stickers).length; i++) {
        const sticker = new Mesh(stickerGeo, mats.U);
        sticker.raycast = () => {};
        group.add(sticker);
        stickers.push(sticker);
      }
      rootGroup.add(group);
      const node: PieceNode = { id: piece.id, group, body, stickers };
      layoutPiece(node, piece, mats);
      return node;
    });
    nodes.current = built;
    shown.current = pieces;

    return () => {
      for (const node of built) rootGroup.remove(node.group);
      bodyGeo.dispose();
      stickerGeo.dispose();
      bodyMat.dispose();
      for (const mat of Object.values(mats)) mat.dispose();
      materials.current = null;
      nodes.current = [];
    };
  }, []);

  useFrame((_, delta) => {
    const mats = materials.current;
    if (!mats || nodes.current.length === 0) return;
    const capped = Math.min(delta, 0.05);
    const state = useCube.getState();

    if (state.epoch !== epochSeen.current) {
      epochSeen.current = state.epoch;
      anim.current = null;
      for (const node of nodes.current) {
        const piece = state.pieces.find((item) => item.id === node.id);
        if (piece) layoutPiece(node, piece, mats);
      }
      shown.current = state.pieces;
    }

    if (!anim.current && state.queue.length > 0) {
      const [move, ...rest] = state.queue;
      if (move) {
        useCube.setState({ queue: rest, locked: true });
        anim.current = {
          move,
          elapsed: 0,
          duration: durationFor(move, useCube.getState().speed, reducedRef.current),
          pieces: state.pieces,
        };
      }
    }

    if (anim.current) {
      const current = anim.current;
      current.elapsed += capped;
      const spec = parseMove(current.move);
      const t = current.duration <= 0 ? 1 : Math.min(1, current.elapsed / current.duration);
      const angle = spec.sign * (Math.PI / 2) * spec.turns * (t >= 1 ? 1 : ease(t));
      _quat.setFromAxisAngle(AXIS[spec.axis], angle);
      for (const node of nodes.current) {
        const piece = current.pieces.find((item) => item.id === node.id);
        if (!piece) continue;
        const onLayer =
          spec.axis === "x"
            ? piece.x === spec.layer
            : spec.axis === "y"
              ? piece.y === spec.layer
              : piece.z === spec.layer;
        poseLayer(node, piece, onLayer, _quat);
      }
      if (t >= 1) {
        const move = current.move;
        anim.current = null;
        useCube.getState().commit(move);
        const next = useCube.getState().pieces;
        for (const node of nodes.current) {
          const piece = next.find((item) => item.id === node.id);
          if (piece) layoutPiece(node, piece, mats);
        }
        shown.current = next;
      }
      return;
    }

    if (shown.current !== state.pieces) {
      for (const node of nodes.current) {
        const piece = state.pieces.find((item) => item.id === node.id);
        if (piece) layoutPiece(node, piece, mats);
      }
      shown.current = state.pieces;
    }

    if (state.queue.length === 0 && (state.locked || state.mode !== "idle")) {
      useCube.setState({ locked: false, mode: "idle" });
    }
  });

  useLayoutEffect(() => {
    const element = gl.domElement;
    const raycaster = new Raycaster();
    const pointers = new Map<number, { x: number; y: number }>();
    let gesture: {
      pointerId: number;
      x: number;
      y: number;
      px: Coord;
      py: Coord;
      pz: Coord;
      normal: Face;
    } | null = null;
    let orbit: { pointerId: number; x: number; y: number } | null = null;
    let pair: { x: number; y: number } | null = null;

    const height = () => element.getBoundingClientRect().height;

    const midpoint = () => {
      let x = 0;
      let y = 0;
      for (const point of pointers.values()) {
        x += point.x;
        y += point.y;
      }
      const n = pointers.size || 1;
      return { x: x / n, y: y / n };
    };

    const onDown = (event: PointerEvent) => {
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size >= 2) {
        gesture = null;
        orbit = null;
        pair = midpoint();
        return;
      }
      const store = useCube.getState();
      if (store.locked || store.mode !== "idle") {
        orbit = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        return;
      }
      const rect = element.getBoundingClientRect();
      _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_pointer, camera);
      const hit = raycaster.intersectObjects(
        nodes.current.map((node) => node.body),
        false,
      )[0];
      if (!hit?.face) {
        orbit = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        return;
      }
      _normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      const normal = snapNormal(_normal);
      const data = hit.object.userData as { x?: number; y?: number; z?: number };
      if (!normal || data.x === undefined || data.y === undefined || data.z === undefined) {
        orbit = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        return;
      }
      gesture = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        px: data.x as Coord,
        py: data.y as Coord,
        pz: data.z as Coord,
        normal,
      };
    };

    const onMove = (event: PointerEvent) => {
      const point = pointers.get(event.pointerId);
      if (!point) return;
      point.x = event.clientX;
      point.y = event.clientY;
      if (pointers.size >= 2) {
        gesture = null;
        orbit = null;
        const mid = midpoint();
        if (pair) useView.getState().nudge(mid.x - pair.x, mid.y - pair.y, height());
        pair = mid;
        return;
      }
      if (gesture && event.pointerId === gesture.pointerId) {
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        if (dx * dx + dy * dy < 14 * 14) return;
        _right.setFromMatrixColumn(camera.matrixWorld, 0);
        _up.setFromMatrixColumn(camera.matrixWorld, 1);
        _drag.copy(_right).multiplyScalar(dx).addScaledVector(_up, -dy);
        const move = decideTurn(gesture.normal, { x: gesture.px, y: gesture.py, z: gesture.pz }, _drag);
        if (!move) return;
        gesture = null;
        useCube.getState().enqueue([move]);
        return;
      }
      if (orbit && event.pointerId === orbit.pointerId) {
        useView.getState().nudge(event.clientX - orbit.x, event.clientY - orbit.y, height());
        orbit.x = event.clientX;
        orbit.y = event.clientY;
      }
    };

    const onUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (gesture?.pointerId === event.pointerId) gesture = null;
      if (orbit?.pointerId === event.pointerId) orbit = null;
      if (pointers.size < 2) pair = null;
      if (pointers.size >= 2) pair = midpoint();
    };

    element.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      element.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [camera, gl]);

  return <group ref={root} />;
}
