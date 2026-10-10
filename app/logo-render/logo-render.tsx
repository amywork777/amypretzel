"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshPhysicalMaterial, NeutralToneMapping } from "three";
import { createPretzelGeometry } from "../book/pretzel-geometry";

// The pretzel mark: the same rope as the 3D chapters, baked like a real soft
// pretzel: a glossy lye-dark crust, a pale split belly, coarse salt.
// Transparent background, square.
function Mark() {
  const { dough, toppings } = useMemo(() => createPretzelGeometry(false, "logo"), []);
  const materials = useMemo(() => ({
    // The lye bath leaves a thin glossy skin over a slightly rough crust.
    crust: new MeshPhysicalMaterial({ vertexColors: true, roughness: .62, clearcoat: .35, clearcoatRoughness: .45 }),
    // Coarse salt: faceted, bright, a little glassy.
    salt: new MeshPhysicalMaterial({ vertexColors: true, roughness: .28, clearcoat: .4, flatShading: true }),
  }), []);
  // Face the camera, lobes up, leaning back a touch so it reads as an object.
  return <group rotation={[-.32, 0, 0]}>
    <group rotation={[0, -Math.PI / 2, 0]}>
      <mesh geometry={dough} material={materials.crust} />
      <mesh geometry={toppings} material={materials.salt} />
    </group>
  </group>;
}

export default function LogoRender() {
  return <div style={{ width: 1024, height: 1024, background: "transparent" }}>
    <Canvas
      id="logo"
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1024 / 1.04 }}
      dpr={1}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = NeutralToneMapping; }}
    >
      {/* A warm bakery window up and to the left, a gentle fill. */}
      <ambientLight intensity={.12} />
      <directionalLight position={[-2.5, 3.5, 3]} intensity={3} color="#fff4e6" />
      <directionalLight position={[3, -1.5, 2]} intensity={.35} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#3a3a3a"]} />
        <Lightformer form="rect" intensity={1.1} position={[-2, 3, 4]} scale={[5, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={.35} position={[3, 0, 3]} scale={[4, 6, 1]} target={[0, 0, 0]} />
      </Environment>
      <Mark />
    </Canvas>
  </div>;
}
