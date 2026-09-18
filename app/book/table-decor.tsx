"use client";

import { Environment, Lightformer, useGLTF, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Box3,
  Group,
  Shape,
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

import { useCompactBook } from "./use-compact-book";
import { usePropGesture, type TableState, type DraggingChange } from "./table-interactions";

type InteractionProps = { table: TableState; onDraggingChange: DraggingChange };
const smooth = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
function approach(value: number, target: number, delta: number, reduced: boolean) {
  const next = reduced ? target : value + (target - value) * (1 - Math.exp(-Math.min(delta, .05) * 10));
  return Math.abs(next - target) < .0001 ? target : next;
}

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

function InteractiveFlower({ index, narrow, table, onDraggingChange, children }: InteractionProps & { index: number; narrow: boolean; children: ReactNode }) {
  const root = useRef<Group>(null!);
  const progress = useRef(0);
  const preview = useRef<number | null>(null);
  const restingHeight = useRef(.25);
  const { invalidate } = useThree();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, "grab");
  const out = table.flowersOut[index];
  const restAngle = narrow ? -Math.PI / 2 : Math.PI / 2;
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  useLayoutEffect(() => {
    const group = root.current;
    const rotation = group.rotation.x;
    const position = group.position.clone();
    group.position.set(0, 0, 0);
    group.rotation.x = restAngle;
    group.updateWorldMatrix(true, true);
    const bounds = new Box3().setFromObject(group, true);
    restingHeight.current = -bounds.min.y / .75 + .009;
    group.position.copy(position);
    group.rotation.x = rotation;
    invalidate();
  }, [restAngle, invalidate]);
  const gesture = usePropGesture({
    onDraggingChange, resetVersion: table.resetVersion,
    onStart: () => { preview.current = progress.current; invalidate(); },
    onMove: (_dx, dy) => { if (!out) preview.current = Math.min(.3, Math.max(0, -dy / 240)); invalidate(); },
    onEnd: (moved, _dx, dy) => { preview.current = null; if (!moved || dy < -20 || out) table.setFlower(index, !out); invalidate(); },
    onCancel: () => { preview.current = null; invalidate(); },
  });
  useFrame((_, delta) => {
    const target = preview.current ?? (out ? 1 : 0);
    progress.current = approach(progress.current, target, delta, reduced);
    const p = progress.current;
    const lift = smooth(p / .3), move = smooth((p - .3) / .25), turn = smooth((p - .55) / .23), lower = smooth((p - .78) / .22);
    root.current.position.set(((narrow ? -.16 : .12) + index * .17) * move, .82 * lift * (1 - lower) + restingHeight.current * lower, (narrow ? -.58 : .58) * move);
    root.current.rotation.x = restAngle * turn;
    if (p !== target) invalidate();
  });
  return <group ref={root} name={`interactive-flower-${index}`} onPointerDown={gesture} onPointerOver={e => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>{children}</group>;
}

function Flowers({ table, onDraggingChange, narrow }: InteractionProps & { narrow: boolean }) {
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
      <InteractiveFlower key={i} index={i} table={table} onDraggingChange={onDraggingChange} narrow={narrow}>
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
      </InteractiveFlower>
    ))}
  </>;
}

function FlowerVase(props: InteractionProps & { narrow: boolean }) {
  const lowDetail = useCompactBook();
  return <group name="glass-vase-and-tulips">
    <Flowers {...props} />
    <mesh position={[0, .18, 0]}>
      <cylinderGeometry args={[.209, .20, .27, 48]} />
      <meshPhysicalMaterial color="#d8e8d9" transparent opacity={.13} roughness={.1} depthWrite={false} />
    </mesh>
    <mesh position={[0, .315, 0]} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[.209, 64]} />
      <meshPhysicalMaterial color="#dce9e3" transparent opacity={.2} roughness={.08} metalness={.15} side={DoubleSide} depthWrite={false} />
    </mesh>
    <mesh>
      <latheGeometry args={[vaseProfile, lowDetail ? 32 : 96]} />
      <meshPhysicalMaterial transparent={lowDetail} opacity={lowDetail ? .22 : 1} thickness={.04} transmission={lowDetail ? 0 : 1} roughness={.045} ior={1.46} color="#f1f8f4" envMapIntensity={1.2} />
    </mesh>
    <mesh position={[0, .606, 0]} rotation-x={Math.PI / 2}>
      <torusGeometry args={[.141, .006, 8, 80]} />
      <meshPhysicalMaterial color="#e4f0ea" transparent={lowDetail} opacity={lowDetail ? .5 : 1} transmission={lowDetail ? 0 : .94} thickness={.01} roughness={.07} ior={1.46} />
    </mesh>
  </group>;
}

function Coffee({ table, onDraggingChange, narrow }: InteractionProps & { narrow: boolean }) {
  const pivot = useRef<Group>(null!);
  const puddle = useRef<Group>(null!);
  const liquidSurface = useRef<Mesh>(null!);
  const pour = useRef<Mesh>(null!);
  const stream = useRef({ mouth: new Vector3(), end: new Vector3(), direction: new Vector3(), up: new Vector3(0, 1, 0), axis: new Vector3(1, 0, 0) });
  const progress = useRef(0);
  const spill = useRef(0);
  const preview = useRef<number | null>(null);
  const start = useRef(0);
  const { invalidate } = useThree();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered, "grab");
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
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
  const { cup, saucer, surface, support, glaze, liquid } = useMemo(() => {
    const scene = cupModel.clone(true);
    const glaze = new MeshPhysicalMaterial({ color: "#e7e3d8", roughness: .22, clearcoat: .65, clearcoatRoughness: .13 });
    const liquid = new MeshPhysicalMaterial({ map: coffee, transparent: true, roughness: .12, clearcoat: 1, clearcoatRoughness: .05 });
    scene.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const isCoffee = object.name === "coffee_surface";
      object.material = isCoffee ? liquid : glaze;
      object.castShadow = !isCoffee;
      object.receiveShadow = true;
    });
    const cup = scene.getObjectByName("tea_cup") as Mesh;
    const saucer = scene.getObjectByName("tea_saucer") as Mesh;
    const surface = scene.getObjectByName("coffee_surface") as Mesh;
    // Actual ceramic vertices determine ground contact throughout the roll.
    // Keep the original joined handle and leave the saucer on the table.
    cup.updateMatrix();
    const vertices = cup.geometry.getAttribute("position");
    const support: Vector3[] = [];
    for (let i = 0; i < vertices.count; i++) {
      support.push(new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(cup.matrix).multiplyScalar(5.58).applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2 - .4).add(new Vector3(0, -.01363, 0)));
    }
    return { cup, saucer, surface, support, glaze, liquid };
  }, [cupModel, coffee]);
  useEffect(() => () => { coffee.dispose(); glaze.dispose(); liquid.dispose(); }, [coffee, glaze, liquid]);

  useEffect(() => { progress.current = 0; spill.current = 0; preview.current = null; invalidate(); }, [table.resetVersion, invalidate]);
  const gesture = usePropGesture({
    onDraggingChange, resetVersion: table.resetVersion,
    onStart: () => { start.current = progress.current; preview.current = start.current; invalidate(); },
    onMove: (dx, dy) => { preview.current = Math.max(0, Math.min(1, start.current - dy / 150 + Math.abs(dx) / 220)); invalidate(); },
    onEnd: moved => { const target = moved ? (preview.current ?? 0) > .35 : !table.coffeeTipped; preview.current = null; table.setCoffee(target); invalidate(); },
    onCancel: () => { preview.current = null; invalidate(); },
  });
  const puddleShape = useMemo(() => {
    const shape = new Shape();
    for (let i = 0; i <= 64; i++) {
      const a = i / 64 * Math.PI * 2;
      const r = 1 + .07 * Math.sin(a * 3) + .04 * Math.cos(a * 7);
      const x = Math.cos(a) * .45 * r, y = Math.sin(a) * .31 * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    return shape;
  }, []);
  useFrame((_, delta) => {
    const target = preview.current ?? (table.coffeeTipped ? 1 : 0);
    progress.current = approach(progress.current, target, delta, reduced);
    const p = progress.current;
    const angle = -Math.PI / 2 * p;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    let bottom = Infinity;
    for (const v of support) bottom = Math.min(bottom, v.y * cos - v.z * sin);
    pivot.current.rotation.x = angle;
    pivot.current.position.set(narrow ? -.4 * p : 0, -bottom + .01743 * (1 - p) + .003 * p + .105 * Math.sin(Math.PI * p), -.5 * p);
    if (p > .24 && (table.coffeeTipped || preview.current !== null) && !table.coffeeSpilled) table.spillCoffee();
    const spillTarget = table.coffeeSpilled ? 1 : 0;
    spill.current = approach(spill.current, spillTarget, delta * .55, reduced);
    const liquidMaterial = liquidSurface.current.material as MeshPhysicalMaterial;
    liquidMaterial.opacity = 1 - smooth(spill.current / .65);
    liquidSurface.current.visible = liquidMaterial.opacity > .001;
    puddle.current.visible = spill.current > .001;
    puddle.current.scale.setScalar(Math.max(.001, smooth(spill.current)));
    pour.current.visible = p > .2 && p < .85 && spill.current < .95 && table.coffeeSpilled;
    if (pour.current.visible) {
      stream.current.mouth.set(0, .069 * 5.58 - .01363, -.27).applyAxisAngle(stream.current.axis, angle).add(pivot.current.position);
      stream.current.end.set(narrow ? -.34 : .06, .004, -.95);
      stream.current.direction.subVectors(stream.current.end, stream.current.mouth);
      pour.current.position.copy(stream.current.mouth).add(stream.current.end).multiplyScalar(.5);
      pour.current.scale.set(1, stream.current.direction.length(), 1);
      pour.current.quaternion.setFromUnitVectors(stream.current.up, stream.current.direction.normalize());
    }
    if (p !== target || spill.current !== spillTarget) invalidate();
  });
  return <group name="coffee-cup-and-saucer">
    <group scale={5.58} position-y={.0038} rotation-y={-Math.PI / 2 - .4}><primitive object={saucer} dispose={null} /></group>
    <group ref={pivot} name="interactive-coffee" onPointerDown={gesture} onPointerOver={e => { e.stopPropagation(); setHovered(true); }} onPointerOut={() => setHovered(false)}>
      <group scale={5.58} position-y={-.01363} rotation-y={-Math.PI / 2 - .4}>
        <primitive object={cup} dispose={null} /><primitive ref={liquidSurface} object={surface} dispose={null} />
      </group>
    </group>
    <mesh ref={pour} visible={false}><cylinderGeometry args={[.014, .024, 1, 8]} /><meshPhysicalMaterial color="#4b2915" transparent opacity={.78} roughness={.12} clearcoat={1} /></mesh>
    <group ref={puddle} position={[narrow ? -.34 : .06, .002, -.95]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow><shapeGeometry args={[puddleShape]} /><meshPhysicalMaterial color="#392013" transparent opacity={.88} roughness={.14} clearcoat={1} depthWrite={false} /></mesh>
      {[[-.4, .22, .036], [.44, -.12, .027], [.36, .3, .019]].map(([x, z, radius], i) => <mesh key={i} position={[x, .0002, z]} rotation-x={-Math.PI / 2}><circleGeometry args={[radius, 16]} /><meshPhysicalMaterial color="#392013" roughness={.14} clearcoat={1} /></mesh>)}
    </group>
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

export default function TableDecor({ table, onDraggingChange }: InteractionProps) {
  const lowDetail = useCompactBook();
  const { size } = useThree();
  const narrow = size.width / size.height < .9;
  return <>
    {/* Reflection cards live only in the environment, outside the visible scene. */}
    <Environment resolution={lowDetail ? 64 : 128} frames={1} environmentIntensity={.45}>
      <Lightformer form="rect" intensity={3} position={[-3, 4, 2]} scale={[3, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2} position={[-1, 3, -3]} scale={[3, 2, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.5} position={[4, 3, -3]} scale={[1, 4, 1]} target={[0, 0, 0]} />
    </Environment>
    <group position={narrow ? [-.95, 0, -1.65] : [-2.03, 0, -.35]} scale={.75}><FlowerVase table={table} onDraggingChange={onDraggingChange} narrow={narrow} /></group>
    <group position={narrow ? [.93, 0, -1.5] : [1.78, 0, -.35]}><Coffee table={table} onDraggingChange={onDraggingChange} narrow={narrow} /></group>
    <group position={narrow ? [.6, .024, 1.65] : [1.65, .024, .56]}><Pen /></group>
  </>;
}
