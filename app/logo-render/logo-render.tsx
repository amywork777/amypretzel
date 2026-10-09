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
  const chrome = useMemo(() => new MeshPhysicalMaterial({ color: "#e4e6ea", metalness: 1, roughness: .14, clearcoat: 1, clearcoatRoughness: .06 }), []);
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
      {/* Chrome is only its reflections. Silver reads as a bright studio with
          a few dark bands for the edges and the horizon to fall into. */}
      <Environment resolution={512} frames={1}>
        <color attach="background" args={["#b9bcc2"]} />
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 1]} scale={[10, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} position={[-3, 2, 3]} scale={[2.5, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1} color="#0d0d10" position={[0, -1.6, 4]} scale={[12, 1.4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1} color="#0d0d10" position={[4, 1, 1]} scale={[.8, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1} color="#1c1d21" position={[-4, -1, -2]} scale={[3, 3, 1]} target={[0, 0, 0]} />
      </Environment>
      <Mark />
    </Canvas>
  </div>;
}
