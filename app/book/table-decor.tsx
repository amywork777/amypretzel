"use client";

import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  BufferGeometry,
  CatmullRomCurve3,
  CanvasTexture,
  SRGBColorSpace,
  DoubleSide,
  Float32BufferAttribute,
  Vector2,
  Vector3,
  Mesh,
  MeshPhysicalMaterial,
} from "three";

const vaseProfile = [
  [0, 0], [.17, 0], [.205, .018], [.225, .09], [.228, .22],
  [.20, .36], [.15, .49], [.145, .59], [.148, .61],
  [.134, .61], [.131, .585], [.137, .49], [.187, .36],
  [.214, .22], [.211, .09], [.187, .035], [0, .035],
].map(([x, y]) => new Vector2(x, y));

// Curved, tapered surfaces give the flowers thin overlapping petals and leaves.
function botanicalSurface(leaf = false) {
  const geometry = new BufferGeometry();
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const rows = 24;
  const columns = 12;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    for (let i = 0; i <= columns; i++) {
      const u = i / columns * 2 - 1;
      const width = Math.pow(Math.sin(Math.PI * t * (leaf ? 1 : .8)), .65) * (leaf ? .065 : .115);
      const x = u * width;
      const y = t * (leaf ? .49 : .31) - (leaf ? 0 : .045 * u * u * t ** 3);
      const z = leaf
        ? .22 * t * t + .02 * u * u
        : .018 + .13 * Math.sin(t * Math.PI * .7) + .018 * u * u;
      vertices.push(x, y, z);
      const shade = .83 + .17 * t - Math.abs(u) * .035;
      colors.push(shade, shade, shade);
      if (j < rows && i < columns) {
        const a = j * (columns + 1) + i;
        indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
      }
    }
  }
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const flowers = [
  { tip: [-.20, 1.13, -.03], color: "#e8a18e", tilt: -.22, scale: 1 },
  { tip: [.16, 1.25, -.08], color: "#f1d9b7", tilt: .15, scale: .92 },
  { tip: [.03, .96, .18], color: "#c96e78", tilt: -.1, scale: .91 },
  { tip: [-.12, 1.35, -.17], color: "#e4b1a0", tilt: -.25, scale: .84 },
];

function Flowers() {
  const { petal, leaf, stems } = useMemo(() => ({
    petal: botanicalSurface(),
    leaf: botanicalSurface(true),
    stems: flowers.map(({ tip }, i) => new CatmullRomCurve3([
      new Vector3((i - 1.5) * .035, .05, (i % 2) * .035),
      new Vector3((i - 1.5) * .025, .48, 0),
      new Vector3(tip[0] * .7, tip[1] * .82, tip[2] * .7),
      new Vector3(...tip),
    ])),
  }), []);
  useEffect(() => () => { petal.dispose(); leaf.dispose(); }, [petal, leaf]);

  return <>
    {flowers.map((flower, i) => (
      <group key={i}>
        <mesh castShadow>
          <tubeGeometry args={[stems[i], 32, .008, 7, false]} />
          <meshStandardMaterial color={i % 2 ? "#667840" : "#738647"} roughness={.72} />
        </mesh>
        <group position={[(i - 1.5) * .025, .48 + (i % 2) * .12, 0]} rotation={[.25, i * 2.4, -.2]}>
          <mesh geometry={leaf} castShadow receiveShadow>
            <meshPhysicalMaterial color="#596e36" roughness={.6} side={DoubleSide} vertexColors sheen={.35} sheenColor="#8d9b65" />
          </mesh>
        </group>
        <group position={flower.tip as [number, number, number]} rotation={[.1, i * .8, flower.tilt]} scale={flower.scale}>
          {Array.from({ length: 6 }, (_, j) => (
            <group key={j} rotation-y={j * Math.PI / 3} scale={j % 2 ? .95 : 1}>
              <mesh geometry={petal} castShadow receiveShadow>
                <meshPhysicalMaterial color={flower.color} roughness={.53} side={DoubleSide} vertexColors sheen={.8} sheenColor="#ffe4d4" metalness={0} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, .07, 0]}>
            <sphereGeometry args={[.034, 12, 8]} />
            <meshStandardMaterial color="#b69942" roughness={.95} />
          </mesh>
        </group>
      </group>
    ))}
  </>;
}

function FlowerVase() {
  return <group name="glass-vase-and-tulips">
    <Flowers />
    <mesh position={[0, .18, 0]}>
      <cylinderGeometry args={[.209, .20, .27, 48]} />
      <meshPhysicalMaterial color="#d8e8d9" transparent opacity={.13} roughness={.1} depthWrite={false} />
    </mesh>
    <mesh position={[0, .315, 0]} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[.209, 64]} />
      <meshPhysicalMaterial color="#dce9e3" transparent opacity={.2} roughness={.08} metalness={.15} side={DoubleSide} depthWrite={false} />
    </mesh>
    <mesh>
      <latheGeometry args={[vaseProfile, 96]} />
      <meshPhysicalMaterial thickness={.04} transmission={1} roughness={.045} ior={1.46} color="#f1f8f4" envMapIntensity={1.2} />
    </mesh>
    <mesh position={[0, .606, 0]} rotation-x={Math.PI / 2}>
      <torusGeometry args={[.141, .006, 8, 80]} />
      <meshPhysicalMaterial color="#e4f0ea" transmission={.94} thickness={.01} roughness={.07} ior={1.46} />
    </mesh>
  </group>;
}

function Coffee() {
  const { scene: cupModel } = useGLTF("/book/coffee-cup.glb");
  const coffee = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#29170e";
    ctx.fillRect(0, 0, 512, 512);
    // A thin, uneven crema collects at the edge of the espresso.
    for (let i = 0; i < 3000; i++) {
      const angle = i * 2.39996;
      const random = Math.sin(i * 78.23) * 43251.18;
      const f = random - Math.floor(random);
      const r = 232 + 22 * f;
      ctx.fillStyle = `rgba(166,111,56,${.07 + f * .25})`;
      ctx.beginPath();
      ctx.arc(256 + Math.cos(angle) * r, 256 + Math.sin(angle) * r, 1 + f * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  const { scene, glaze, liquid } = useMemo(() => {
    const scene = cupModel.clone(true);
    const glaze = new MeshPhysicalMaterial({ color: "#e7e3d8", roughness: .22, clearcoat: .65, clearcoatRoughness: .13 });
    const liquid = new MeshPhysicalMaterial({ map: coffee, roughness: .12, clearcoat: 1, clearcoatRoughness: .05 });
    scene.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const isCoffee = object.name === "coffee_surface";
      object.material = isCoffee ? liquid : glaze;
      object.castShadow = !isCoffee;
      object.receiveShadow = true;
    });
    return { scene, glaze, liquid };
  }, [cupModel, coffee]);
  useEffect(() => () => { coffee.dispose(); glaze.dispose(); liquid.dispose(); }, [coffee, glaze, liquid]);

  // Original cup and handle are one joined mesh. The fitted liquid follows its
  // inner wall, with headroom below the rim; source dimensions are in meters.
  return <group name="coffee-cup-and-saucer" scale={5.58} position-y={.0038} rotation-y={-Math.PI / 2 - .4}>
    <primitive object={scene} dispose={null} />
  </group>;
}

useGLTF.preload("/book/coffee-cup.glb");

function Pen() {
  return <group name="green-and-brass-pen" rotation={[Math.PI / 2, 0, -.28]}>
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[.021, .021, .66, 24]} />
      <meshPhysicalMaterial color="#183f36" roughness={.22} clearcoat={1} />
    </mesh>
    <mesh position={[0, -.375, 0]} castShadow>
      <cylinderGeometry args={[.021, .009, .09, 24]} />
      <meshStandardMaterial color="#b9a16b" roughness={.25} metalness={.85} />
    </mesh>
    <mesh position={[0, -.437, 0]} rotation-z={Math.PI} castShadow>
      <coneGeometry args={[.009, .035, 20]} />
      <meshStandardMaterial color="#c9c8c3" roughness={.2} metalness={1} />
    </mesh>
    <mesh position={[0, .335, 0]} castShadow>
      <cylinderGeometry args={[.021, .021, .018, 24]} />
      <meshStandardMaterial color="#b9a16b" roughness={.24} metalness={.85} />
    </mesh>
    <mesh position={[0, .245, -.025]} castShadow>
      <boxGeometry args={[.009, .18, .006]} />
      <meshStandardMaterial color="#b9a16b" roughness={.24} metalness={.85} />
    </mesh>
  </group>;
}

export default function TableDecor() {
  const { size } = useThree();
  const narrow = size.width / size.height < .9;
  return <>
    {/* Reflection cards live only in the environment, outside the visible scene. */}
    <Environment resolution={128} frames={1} environmentIntensity={.45}>
      <Lightformer form="rect" intensity={3} position={[-3, 4, 2]} scale={[3, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2} position={[-1, 3, -3]} scale={[3, 2, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.5} position={[4, 3, -3]} scale={[1, 4, 1]} target={[0, 0, 0]} />
    </Environment>
    <group position={narrow ? [-.95, 0, -1.65] : [-2.03, 0, -.35]} scale={.75}><FlowerVase /></group>
    <group position={narrow ? [.93, 0, -1.5] : [1.78, 0, -.35]}><Coffee /></group>
    <group position={narrow ? [.6, .024, 1.65] : [1.65, .024, .56]}><Pen /></group>
  </>;
}
