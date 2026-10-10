"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { Float32BufferAttribute, MeshPhysicalMaterial, NeutralToneMapping, Vector3 } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createPretzelGeometry } from "../book/pretzel-geometry";

// Low, broad swells along the rope: real dough rises a little unevenly.
function lump(p: Vector3) {
  return Math.sin(p.x * 23 + p.y * 7) * Math.sin(p.y * 19 - p.z * 11) * .5
    + Math.sin(p.z * 31 + p.x * 13) * .3
    + Math.sin((p.x + p.y + p.z) * 57) * .2;
}

// Bake mottling: the crust browns in patches, darker where it rose highest.
function mottle(p: Vector3) {
  return Math.sin(p.y * 41 + p.z * 17) * Math.sin(p.z * 37 - p.x * 23) * .6 + Math.sin((p.y - p.z) * 89) * .4;
}

const key = (p: Vector3) => `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;

// The pretzel mark: the same rope as the 3D chapters, baked like a real soft
// pretzel: a glossy lye-dark crust, a pale split belly, coarse salt.
// Transparent background, square.
function Mark() {
  const { dough, toppings } = useMemo(() => {
    const shape = createPretzelGeometry(false, "logo");
    // Weld the tube's seam so the swells don't crack it open. The bake colours
    // differ across the seam, so set them aside by position and restore them.
    const raw = shape.dough;
    const rawPosition = raw.getAttribute("position"), rawColor = raw.getAttribute("color");
    const colours = new Map<string, [number, number, number]>();
    const p = new Vector3(), n = new Vector3();
    for (let i = 0; i < rawPosition.count; i++) {
      const k = key(p.fromBufferAttribute(rawPosition, i));
      if (!colours.has(k)) colours.set(k, [rawColor.getX(i), rawColor.getY(i), rawColor.getZ(i)]);
    }
    raw.deleteAttribute("color");
    const dough = mergeVertices(raw, 1e-4);
    const position = dough.getAttribute("position");
    dough.computeVertexNormals();
    const normal = dough.getAttribute("normal");
    const colour = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i);
      n.fromBufferAttribute(normal, i);
      const [r, g, b] = colours.get(key(p)) ?? [.56, .31, .13];
      const shade = 1 + mottle(p) * .1;
      colour.set([r * shade, g * shade, b * shade], i * 3);
      p.addScaledVector(n, lump(p) * .0035);
      position.setXYZ(i, p.x, p.y, p.z);
    }
    dough.setAttribute("color", new Float32BufferAttribute(colour, 3));
    dough.computeVertexNormals();
    return { dough, toppings: shape.toppings };
  }, []);
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
