"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { MeshPhysicalMaterial, NeutralToneMapping, Vector3 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createPretzelGeometry } from "../book/pretzel-geometry";

// Gentle hand-made unevenness: a few overlapping waves through space, so the
// rope swells and dents a little the way rolled clay does.
function lump(p: Vector3) {
  return Math.sin(p.x * 23 + p.y * 7) * Math.sin(p.y * 19 - p.z * 11) * .5
    + Math.sin(p.z * 31 + p.x * 13) * .3
    + Math.sin((p.x + p.y + p.z) * 57) * .2;
}

// The pretzel mark: the same rope as the 3D chapters, chubby, in matte
// clay with little balls of clay salt. Transparent background, square.
function Mark() {
  const { dough, toppings } = useMemo(() => {
    const shape = createPretzelGeometry(false, "logo");
    // Weld the tube's seam so the dents don't crack it open, then dent.
    shape.dough.deleteAttribute("color");
    const dough = mergeVertices(shape.dough, 1e-4);
    const position = dough.getAttribute("position");
    dough.computeVertexNormals();
    const normal = dough.getAttribute("normal");
    const p = new Vector3(), n = new Vector3();
    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i);
      n.fromBufferAttribute(normal, i);
      p.addScaledVector(n, lump(p) * .006);
      position.setXYZ(i, p.x, p.y, p.z);
    }
    dough.computeVertexNormals();
    return { dough, toppings: shape.toppings };
  }, []);
  const materials = useMemo(() => ({
    // Clay is matte with a soft sheen where it turns from the light.
    clay: new MeshPhysicalMaterial({ color: "#b8692e", roughness: .74, sheen: .6, sheenRoughness: .6, sheenColor: "#ffe3c2" }),
    salt: new MeshPhysicalMaterial({ vertexColors: true, roughness: .7, sheen: .4, sheenColor: "#ffffff" }),
  }), []);
  // Face the camera, lobes up, leaning back a touch so it reads as an object.
  return <group rotation={[-.32, 0, 0]}>
    <group rotation={[0, -Math.PI / 2, 0]}>
      <mesh geometry={dough} material={materials.clay} />
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
      {/* A soft studio: one big window up and to the left, a gentle fill. */}
      <ambientLight intensity={.12} />
      <directionalLight position={[-2.5, 3.5, 3]} intensity={3} />
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
