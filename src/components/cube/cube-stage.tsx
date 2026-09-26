import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { useView } from "@/lib/cube/view";
import { PhysicalCube } from "./physical-cube";

function ViewCamera() {
  const camera = useThree((state) => state.camera);
  useFrame(() => {
    const { yaw, pitch, distance } = useView.getState();
    const sin = Math.sin(pitch);
    camera.up.set(0, 1, 0);
    camera.position.set(distance * sin * Math.sin(yaw), distance * Math.cos(pitch), distance * sin * Math.cos(yaw));
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function CubeStage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="stage" aria-label="Rubik's cube. One finger turns a row. Two fingers yaw and pitch the whole cube.">
      {mounted ? (
        <Canvas
          camera={{ position: [4.6, 3.7, 5.6], fov: 32, near: 0.1, far: 60 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <ViewCamera />
          <ambientLight intensity={0.55} />
          <hemisphereLight args={["#f4efe6", "#2a241c", 0.45]} />
          <directionalLight position={[5, 7, 4]} intensity={2.4} color="#fff6ea" />
          <directionalLight position={[-6, 2, -3]} intensity={0.7} color="#c9d4ea" />
          <PhysicalCube />
          <ContactShadows position={[0, -1.72, 0]} opacity={0.42} scale={8} blur={2.2} far={3.2} />
        </Canvas>
      ) : null}
    </div>
  );
}
