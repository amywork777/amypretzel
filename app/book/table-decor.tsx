"use client";

import { Environment, Lightformer, useGLTF, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Group,
  Shape,
  CanvasTexture,
  SRGBColorSpace,
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
    const glaze = new MeshPhysicalMaterial({ color: "#f4f4f4", roughness: .22, clearcoat: .65, clearcoatRoughness: .13 });
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
useGLTF.preload("/book/pencil.glb");

// A plain wooden pencil, lying where a hand would leave it.
const pencilFinishes: Record<string, MeshPhysicalMaterial> = {
  mat13: new MeshPhysicalMaterial({ color: "#e9b636", roughness: .38, clearcoat: .5, clearcoatRoughness: .3 }),
  mat15: new MeshPhysicalMaterial({ color: "#c9c8c3", roughness: .3, metalness: .9 }),
  mat19: new MeshPhysicalMaterial({ color: "#dcb98a", roughness: .8 }),
  mat23: new MeshPhysicalMaterial({ color: "#33302c", roughness: .5 }),
  mat7: new MeshPhysicalMaterial({ color: "#d98a90", roughness: .7 }),
};

function Pencil({ rest }: { rest: [number, number, number] }) {
  const { scene: pencilModel } = useGLTF("/book/pencil.glb");
  const pencil = useMemo(() => {
    const clone = pencilModel.clone(true);
    clone.traverse(object => {
      if (!(object instanceof Mesh)) return;
      const source = Array.isArray(object.material) ? object.material[0] : object.material;
      object.material = pencilFinishes[source.name] ?? pencilFinishes.mat13;
      object.castShadow = true;
      object.receiveShadow = true;
    });
    return clone;
  }, [pencilModel]);
  return <group name="pencil" position={rest} rotation={[Math.PI / 2, 0, -.28]}>
    <primitive object={pencil} scale={.6} />
  </group>;
}

export default function TableDecor({ table, onDraggingChange }: InteractionProps) {
  const lowDetail = useCompactBook();
  const { size } = useThree();
  const narrow = size.width / size.height < .9;
  return <>
    {/* Reflection cards live only in the environment, outside the visible scene. */}
    <Environment resolution={lowDetail ? 64 : 256} frames={1} environmentIntensity={.55}>
      <color attach="background" args={["#0a0a0a"]} />
      <Lightformer form="rect" intensity={3} position={[-3, 4, 2]} scale={[3, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2} position={[-1, 3, -3]} scale={[3, 2, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.5} position={[4, 3, -3]} scale={[1, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" intensity={.5} color="#ffffff" position={[0, 6, 0]} scale={5} rotation-x={Math.PI / 2} />
    </Environment>
    <group position={narrow ? [.62, 0, -1.55] : [1.62, 0, -.55]}><Coffee table={table} onDraggingChange={onDraggingChange} narrow={narrow} /></group>
    <Pencil rest={narrow ? [-.45, .023, 1.35] : [-1.55, .023, .5]} />
  </>;
}
