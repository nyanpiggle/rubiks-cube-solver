import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { PhysicalCube } from "./physical-cube";

export function CubeStage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="stage" aria-label="Rubik's cube. Swipe a row or column to turn it. Drag empty space to orbit.">
      {mounted ? (
        <Canvas
          camera={{ position: [3.2, 2.55, 3.9], fov: 32, near: 0.1, far: 40 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.55} />
          <hemisphereLight args={["#f4efe6", "#2a241c", 0.45]} />
          <directionalLight position={[5, 7, 4]} intensity={2.4} color="#fff6ea" />
          <directionalLight position={[-6, 2, -3]} intensity={0.7} color="#c9d4ea" />
          <PhysicalCube />
          <ContactShadows position={[0, -1.72, 0]} opacity={0.42} scale={8} blur={2.2} far={3.2} />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.75}
            minDistance={5.2}
            maxDistance={11}
            minPolarAngle={0.28}
            maxPolarAngle={Math.PI - 0.28}
          />
        </Canvas>
      ) : null}
    </div>
  );
}
