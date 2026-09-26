import { readFaces, type Face } from "@/lib/cube/engine";
import { useCube } from "@/lib/cube/store";

const CLASS_FOR: Record<Face, string> = {
  U: "bg-sticker-u",
  R: "bg-sticker-r",
  F: "bg-sticker-f",
  D: "bg-sticker-d",
  L: "bg-sticker-l",
  B: "bg-sticker-b",
};

function FaceGrid({ face, cells }: { face: Face; cells: Face[] }) {
  return (
    <div className="net-face" aria-label={`${face} face`}>
      {cells.map((color, index) => (
        <span key={`${face}-${index}`} className={`net-cell ${CLASS_FOR[color]}`} />
      ))}
    </div>
  );
}

export function CubeNet() {
  const pieces = useCube((state) => state.pieces);
  const faces = readFaces(pieces);
  return (
    <div className="net" aria-hidden="true">
      <FaceGrid face="U" cells={faces.U} />
      <FaceGrid face="L" cells={faces.L} />
      <FaceGrid face="F" cells={faces.F} />
      <FaceGrid face="R" cells={faces.R} />
      <FaceGrid face="B" cells={faces.B} />
      <FaceGrid face="D" cells={faces.D} />
    </div>
  );
}
