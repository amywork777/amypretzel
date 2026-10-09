"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
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

// Chrome is only its reflections, so each background gets its own studio.
// The silhouette edge reflects what's behind the pretzel, and faces turned
// to the viewer reflect what's behind the camera.
function OnWhite() {
  // Dark all round, so the outline and the undersides read crisp on paper;
  // a soft grey sky and a few hard strips for the shine.
  return <Environment resolution={1024} frames={1}>
    <color attach="background" args={["#08090b"]} />
    <Lightformer form="rect" intensity={2} color="#d6dce4" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[13, 13, 1]} />
    <Lightformer form="rect" intensity={1.8} color="#e4eaf1" position={[0, 1.2, 6]} scale={[20, 2.4, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={1.2} color="#c3cad3" position={[0, 0, -6]} scale={[6, 3, 1]} />
    <Lightformer form="rect" intensity={5} position={[-3, 2.5, 3]} scale={[.35, 4, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={4} position={[3.2, 1.5, 2.5]} scale={[.25, 3, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={1} color="#7d8794" position={[0, -5, 1]} rotation-x={-Math.PI / 2} scale={[7, 7, 1]} />
  </Environment>;
}

function OnBlack() {
  // A bright backdrop behind the pretzel lights its outline against black;
  // a dark band low in front keeps the chrome contrast across its body.
  return <Environment resolution={1024} frames={1}>
    <color attach="background" args={["#4a5058"]} />
    <Lightformer form="rect" intensity={2.4} color="#f4f7fb" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
    <Lightformer form="rect" intensity={1.8} color="#e8eef5" position={[0, 0, -6]} scale={[20, 8, 1]} />
    <Lightformer form="rect" intensity={1} color="#0b0c0e" position={[0, -.6, 6]} scale={[20, 1.8, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={5} position={[-3, 2.5, 3]} scale={[.35, 4, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={4} position={[3.2, 1.5, 2.5]} scale={[.25, 3, 1]} target={[0, 0, 0]} />
    <Lightformer form="rect" intensity={2} color="#9aa4b1" position={[0, -5, 1]} rotation-x={-Math.PI / 2} scale={[9, 9, 1]} />
  </Environment>;
}

export default function LogoRender() {
  // ?on=black renders the version for dark backgrounds; anything else, white.
  const [onBlack] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("on") === "black");
  return <div style={{ width: 1024, height: 1024, background: "transparent" }}>
    <Canvas
      id="logo"
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1024 / 1.04 }}
      dpr={1}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = NeutralToneMapping; }}
    >
      {onBlack ? <OnBlack /> : <OnWhite />}
      <Mark />
    </Canvas>
  </div>;
}
