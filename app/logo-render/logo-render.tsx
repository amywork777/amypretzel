"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshPhysicalMaterial, NeutralToneMapping } from "three";
import { createPretzelGeometry } from "../book/pretzel-geometry";

// The pretzel mark: the same rope as the 3D chapters, inflated and in
// polished chrome, like a charm. Transparent background, square.
function Mark() {
  const { dough } = useMemo(() => createPretzelGeometry(false, "logo"), []);
  const chrome = useMemo(() => new MeshPhysicalMaterial({ color: "#f3f5f8", metalness: 1, roughness: .05, clearcoat: 1, clearcoatRoughness: .03 }), []);
  // Face the camera, lobes up, leaning back a touch so it reads as an object.
  return <group rotation={[-.28, 0, 0]}>
    <group rotation={[0, -Math.PI / 2, 0]}>
      <mesh geometry={dough} material={chrome} position={[0, -0.01, 0]} />
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
      {/* Chrome is only its reflections. A classic chrome studio: bright sky
          overhead, dark ground below, a hard horizon between them, and a few
          strip lights for the sharp highlights. */}
      <Environment resolution={1024} frames={1}>
        <color attach="background" args={["#0a0a0c"]} />
        <Lightformer form="rect" intensity={2.2} color="#f4f7fb" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#dfe6ef" position={[0, 1.2, -6]} scale={[20, 2.6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#dfe6ef" position={[0, 1.2, 6]} scale={[20, 2.2, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={5} position={[-3, 2.5, 3]} scale={[.35, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={4} position={[3.2, 1.5, 2.5]} scale={[.25, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} color="#7d8794" position={[0, -5, 1]} rotation-x={-Math.PI / 2} scale={[9, 9, 1]} />
      </Environment>
      <Mark />
    </Canvas>
  </div>;
}
