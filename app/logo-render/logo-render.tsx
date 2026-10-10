"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshPhysicalMaterial, NeutralToneMapping } from "three";
import { createPretzelGeometry, pretzelFinish, type PretzelKind } from "../book/pretzel-geometry";

// The pretzel mark: the same rope as the 3D chapters, glazed purple and
// covered in rainbow sprinkles. Also renders the secret page's pink one
// (?kind=secret).
// Transparent background, square.
function Mark({ kind }: { kind: PretzelKind }) {
  // A different twist and scatter for the secret one, so the two aren't twins.
  const { dough, toppings, coat } = useMemo(() => createPretzelGeometry(false, kind, kind === "secret" ? 4 : 0), [kind]);
  const materials = useMemo(() => ({
    // A glaze: a soft shine, like the dips on the pretzel table.
    coat: new MeshPhysicalMaterial({ color: pretzelFinish(kind).coat, roughness: .38, clearcoat: .7, clearcoatRoughness: .22, sheen: .4, sheenColor: "#ffffff" }),
    // The baked dough, where it shows past the glaze.
    crust: new MeshPhysicalMaterial({ vertexColors: true, roughness: .62, clearcoat: .35, clearcoatRoughness: .45 }),
    // Sprinkles: bright, a little glossy.
    toppings: new MeshPhysicalMaterial({ vertexColors: true, roughness: .28, clearcoat: .4, flatShading: true }),
  }), [kind]);
  // Face the camera, lobes up, leaning back a touch so it reads as an object.
  return <group rotation={[-.32, 0, 0]}>
    <group rotation={[0, -Math.PI / 2, 0]}>
      <mesh geometry={dough} material={materials.crust} />
      <mesh geometry={toppings} material={materials.toppings} />
      {coat && <mesh geometry={coat} material={materials.coat} />}
    </group>
  </group>;
}

export default function LogoRender({ kind }: { kind: PretzelKind }) {
  return <div style={{ width: 1024, height: 1024, background: "transparent" }}>
    <Canvas
      id="logo"
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1024 / 1.04 }}
      dpr={1}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMapping = NeutralToneMapping; }}
    >
      {/* A window up and to the left, a gentle fill. */}
      <ambientLight intensity={.12} />
      <directionalLight position={[-2.5, 3.5, 3]} intensity={3} color="#ffffff" />
      <directionalLight position={[3, -1.5, 2]} intensity={.35} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#3a3a3a"]} />
        <Lightformer form="rect" intensity={1.1} position={[-2, 3, 4]} scale={[5, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={.35} position={[3, 0, 3]} scale={[4, 6, 1]} target={[0, 0, 0]} />
      </Environment>
      <Mark kind={kind} />
    </Canvas>
  </div>;
}
