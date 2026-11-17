"""Bake a part's build, step by step, into the static files the CAD stepper demo read
(app/demos/cad-stepper.tsx, now in git history; the page shows stills of it): public/demos/<slug>/steps.json (the steps, as words) and steps.bin
(each step's solid as a mesh, its edges and any sketch lines). Nothing here is drawn or guessed:
every step is a solid a CAD kernel (OpenCascade) built, meshed as it was.

Two sources, one per page:

  studio     A part from one of Studio's sample projects, traced by Studio's own edit tracer
             (cad.edit.tracer, the code behind its feature tree and rollback bar): the tree's
             features in order, and the body after each one as the rollback bar shows it. Run it
             with the Python of a text-to-cad checkout that has cad.edit (Studio's engine), from
             a copy of the project, since the tracer keeps notes in the project it reads:

               <text-to-cad>/.venv/bin/python scripts/make-cad-steps.py studio \\
                 --project /path/to/copy/of/motor-mount-plate --part parts/motor_plate.py \\
                 --out public/demos/studio

  cad-steps  A sample of the CAD-Steps dataset (huggingface.co/datasets/amzyst1/cad-steps): its
             metadata.json and the STEP file of every intermediate state, downloaded into --cache.
             Any Python with build123d will do:

               python scripts/make-cad-steps.py cad-steps --id 00079619 \\
                 --cache /tmp/cad-steps --out public/demos/cad-steps

The binary, per step, in order, each block padded to 4 bytes:
  positions  int16 x3 per vertex, quantized to the bounds of every step together (json "bounds")
  indices    uint16 (uint32 when "wide") x3 per triangle; the triangles from "fresh" on are the
             surface this step added: their centre is not on the previous step's surface
  edges      int16 x6 per segment: the solid's B-rep edges, seams left out
  sketch     int16 x6 per segment: lines drawn but not yet made solid (a sketch state)
Normals are left to the page, per face, since each face's vertices are its own.
"""

from __future__ import annotations

import argparse
import gzip
import json
import math
import os
import sys
import tempfile
import urllib.request
from pathlib import Path

import numpy as np
from build123d import import_step
from OCP.BRep import BRep_Tool
from OCP.BRepClass3d import BRepClass3d_SolidClassifier
from OCP.gp import gp_Pnt
from OCP.TopAbs import TopAbs_ON

LINEAR = 0.0012  # mesh tolerance, as a share of the part's largest size
ANGULAR = 0.35  # radians


# --- geometry -------------------------------------------------------------------------------------


def solids_of(shape):
    return list(shape.solids()) if shape is not None else []


def mesh(shape, size):
    """Every face of the solids, tessellated on its own (so a page's normals stay sharp at its
    edges): vertices and triangles."""
    verts, tris, flat = [], [], []
    for solid in solids_of(shape):
        for face in solid.faces():
            v, t = face.tessellate(LINEAR * size, ANGULAR)
            base = len(verts)
            verts += [(p.X, p.Y, p.Z) for p in v]
            tris += [(a + base, b + base, c + base) for a, b, c in t]
            flat += [face.geom_type.name == "PLANE"] * len(t)
    return (np.array(verts, dtype=np.float64).reshape(-1, 3), np.array(tris, dtype=np.int64).reshape(-1, 3),
            np.array(flat, dtype=bool))


def fresh_mask(verts, tris, flat, previous, size):
    """Which triangles this step added: those whose centre is not on the previous step's surface."""
    before = solids_of(previous)
    if not before or not len(tris):
        return np.zeros(len(tris), dtype=bool)
    # A flat triangle lies on its face; a curved one's centre sits off it by up to the mesh's own
    # deflection, so it is given that much room.
    tight, loose = 1e-4 * size, 2.5 * LINEAR * size
    classifiers = [BRepClass3d_SolidClassifier(s.wrapped) for s in before]
    centres = verts[tris].mean(axis=1)
    fresh = np.ones(len(tris), dtype=bool)
    for i, c in enumerate(centres):
        point = gp_Pnt(*map(float, c))
        for classifier in classifiers:
            classifier.Perform(point, tight if flat[i] else loose)
            if classifier.State() == TopAbs_ON:
                fresh[i] = False
                break
    return fresh


def segments(edges, size):
    """Edges as straight segments, curves divided finely enough to read as curves."""
    out = []
    for edge in edges:
        length = edge.length
        if length < 1e-9:
            continue
        straight = edge.geom_type.name == "LINE"
        n = 1 if straight else max(8, min(64, math.ceil(length / (0.015 * size))))
        points = [edge.position_at(i / n) for i in range(n + 1)]
        out += [(a.X, a.Y, a.Z, b.X, b.Y, b.Z) for a, b in zip(points, points[1:])]
    return np.array(out, dtype=np.float64).reshape(-1, 6)


def same_solid(shape, other):
    """Whether two states hold the same solid: the same faces, volume and extent."""
    a, b = solids_of(shape), solids_of(other)
    if not a or len(a) != len(b):
        return False
    if sum(len(s.faces()) for s in a) != sum(len(s.faces()) for s in b):
        return False
    va, vb = sum(s.volume for s in a), sum(s.volume for s in b)
    ba, bb = shape.bounding_box(), other.bounding_box()
    close = abs(va - vb) <= 1e-6 * max(abs(vb), 1e-12)
    return close and all(abs(x - y) <= 1e-6 * max(ba.diagonal, 1e-12)
                         for x, y in zip((ba.min.X, ba.min.Y, ba.min.Z, ba.max.X, ba.max.Y, ba.max.Z),
                                         (bb.min.X, bb.min.Y, bb.min.Z, bb.max.X, bb.max.Y, bb.max.Z)))


def solid_edges(shape):
    """A solid's edges, less the seams a closed surface is cut along (not edges anyone drew)."""
    kept = []
    for solid in solids_of(shape):
        seams = set()
        for face in solid.faces():
            for edge in face.edges():
                if BRep_Tool.IsClosed_s(edge.wrapped, face.wrapped):
                    seams.add(edge)
        kept += [edge for edge in solid.edges() if edge not in seams]
    return kept


def loose_edges(shape):
    """Edges that belong to no solid: a sketch drawn but not yet extruded."""
    if shape is None:
        return []
    owned = set()
    for solid in solids_of(shape):
        owned.update(solid.edges())
    return [edge for edge in shape.edges() if edge not in owned]


# --- writing --------------------------------------------------------------------------------------


def bake(states, out: Path, manifest: dict):
    """``states``: [(step words, shape)] in order. Writes steps.bin and steps.json to ``out``."""
    shapes = [shape for _, shape in states]
    boxes = [s.bounding_box() for s in shapes if s is not None]
    lo = np.min([[b.min.X, b.min.Y, b.min.Z] for b in boxes], axis=0)
    hi = np.max([[b.max.X, b.max.Y, b.max.Z] for b in boxes], axis=0)
    centre, half = (lo + hi) / 2, max((hi - lo).max() / 2, 1e-9)
    size = 2 * half

    def q(points):
        return np.clip(np.round((points.reshape(-1, 3) - centre) / half * 32767), -32767, 32767).astype("<i2")

    blob = bytearray()

    def put(array) -> int:
        while len(blob) % 4:
            blob.append(0)
        at = len(blob)
        blob.extend(array.tobytes())
        return at

    steps, previous, previous_at = [], None, None
    for words, shape in states:
        sketch = segments(loose_edges(shape), size)
        if previous is not None and same_solid(shape, previous):
            # A sketch drawn on the part leaves its solid as it was: the step shows the solid the
            # step before it made (its mesh, read again) and the new lines.
            steps.append({**words, **{k: steps[-1][k] for k in ("vertices", "triangles", "wide", "edges")},
                          "fresh": steps[-1]["triangles"],
                          "at": {**previous_at, "sketch": put(q(sketch))}, "sketch": len(sketch)})
            print(f"  {words['name']}: the solid before it, and {len(sketch)} sketch segments")
            continue
        verts, tris, flat = mesh(shape, size)
        fresh = fresh_mask(verts, tris, flat, previous, size) if solids_of(previous) else np.zeros(len(tris), dtype=bool)
        order = np.concatenate([np.flatnonzero(~fresh), np.flatnonzero(fresh)])
        tris = tris[order]
        wide = len(verts) > 65535
        edges = segments(solid_edges(shape), size)
        steps.append({
            **words,
            "vertices": len(verts), "triangles": len(tris), "fresh": int((~fresh).sum()), "wide": wide,
            "at": {
                "positions": put(q(verts)),
                "indices": put(tris.astype("<u4" if wide else "<u2")),
                "edges": put(q(edges)),
                "sketch": put(q(sketch)),
            },
            "edges": len(edges), "sketch": len(sketch),
        })
        print(f"  {words['name']}: {len(tris)} triangles ({int(fresh.sum())} new), {len(edges)} edge and {len(sketch)} sketch segments")
        if solids_of(shape):
            previous, previous_at = shape, {k: steps[-1]["at"][k] for k in ("positions", "indices", "edges")}

    out.mkdir(parents=True, exist_ok=True)
    (out / "steps.bin").write_bytes(bytes(blob))
    manifest = {**manifest, "bounds": {"centre": centre.round(6).tolist(), "half": round(float(half), 6), "extent": (hi - lo).round(6).tolist()},
                "bytes": len(blob), "steps": steps}
    (out / "steps.json").write_text(json.dumps(manifest, indent=1) + "\n")
    print(f"wrote {out}/steps.bin ({len(blob) / 1024:.0f} KB) and steps.json")


# --- Studio ---------------------------------------------------------------------------------------


def studio(args):
    from cad.edit import commands, tracer

    project = Path(args.project).resolve()
    script = (project / args.part).resolve()
    reply = tracer.trace({"script": str(script), "root": str(project), "mesh": False})
    if not reply.get("ok"):
        sys.exit(reply.get("error"))
    state = tracer.STATE[str(script)]
    features = reply["features"]
    rel = str(script.relative_to(project))
    units = reply.get("units") or "mm"

    def detail(feature):
        values = (feature.get("edit") or {}).get("values") or {}
        end, depth, length = values.get("end"), values.get("depth"), values.get("length") or values.get("distance")
        if end == "blind" and depth:
            return f"{depth} {units} deep" if feature["kind"].startswith("Cut") else f"{depth} {units}"
        if end and "through" in str(end):
            return "through all"
        if depth:
            return f"{depth} {units}"
        if length:
            return f"{length} {units}"
        return ""

    def lines_of(feature):
        return {int(row.rpartition(":")[2]) for row in feature.get("rows") or [] if row.rpartition(":")[0] == rel}

    states = []
    for feature in features:
        # The body after this feature: the last solid the operations on its lines made (a cut's
        # tool is made first, then the cut), as the tree's rollback bar shows it below the feature.
        lines = lines_of(feature)
        shape = [step["result"] for step in state["steps"]
                 if step.get("frames") and step["frames"][min(state["level"], len(step["frames"]) - 1)]["file"] == rel
                 and step["frames"][min(state["level"], len(step["frames"]) - 1)]["line"] in lines
                 and commands._solid(step["result"])][-1]
        sketch = (feature.get("sketch") or {}).get("name")
        print(feature["kind"], sketch, (feature.get("edit") or {}).get("values"))
        states.append(({"name": sketch or feature["kind"], "kind": feature["kind"], "detail": detail(feature)}, shape))
    bake(states, Path(args.out), {"source": "studio", "part": script.stem, "units": units})


# --- CAD-Steps ------------------------------------------------------------------------------------

HF = "https://huggingface.co/datasets/amzyst1/cad-steps/resolve/main/data"
OPERATIONS = {"NewBodyFeatureOperation": "new body", "JoinFeatureOperation": "join", "CutFeatureOperation": "cut",
              "IntersectFeatureOperation": "intersect", "NewComponentFeatureOperation": "new component"}
EXTENTS = {"OneSideFeatureExtentType": "one side", "SymmetricFeatureExtentType": "symmetric",
           "TwoSidesFeatureExtentType": "two sides"}


def fetch(url: str, to: Path) -> Path:
    if not to.exists():
        to.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url) as response:
            to.write_bytes(response.read())
    return to


def read_step(path: Path):
    handle, file = tempfile.mkstemp(suffix=".step")
    os.close(handle)
    try:
        Path(file).write_bytes(gzip.decompress(path.read_bytes()))
        return import_step(file)
    finally:
        os.unlink(file)


def sketch_words(sketch: dict) -> str:
    counts: dict[str, int] = {}
    for profile in sketch.values():
        for curve in profile.get("curves", []) if isinstance(profile, dict) else []:
            counts[curve["type"]] = counts.get(curve["type"], 0) + 1
    names = {"Line": ("line", "lines"), "Circle": ("circle", "circles"), "Arc": ("arc", "arcs")}
    return ", ".join(f"{n} {names.get(kind, (kind.lower(), kind.lower() + 's'))[n != 1]}" for kind, n in counts.items())


def cad_steps(args):
    cache = Path(args.cache) / args.id
    meta = json.loads(fetch(f"{HF}/{args.id}/metadata.json", cache / "metadata.json").read_text())
    states = []
    for entry in meta["states"]:
        if not entry.get("exported"):
            continue
        shape = read_step(fetch(f"{HF}/{args.id}/{entry['step_file']}", cache / entry["step_file"]))
        if entry["type"] == "Sketch":
            kind, detail = "Sketch", sketch_words(entry.get("sketch") or {})
        else:
            kind = "Extrude"
            detail = ", ".join(x for x in (OPERATIONS.get(entry.get("operation"), ""), EXTENTS.get(entry.get("extent_type"), "")) if x)
        states.append(({"name": entry["name"], "kind": kind, "detail": detail}, shape))
    bake(states, Path(args.out), {"source": "cad-steps", "sample": args.id})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="source", required=True)
    s = sub.add_parser("studio")
    s.add_argument("--project", required=True)
    s.add_argument("--part", required=True)
    s.add_argument("--out", required=True)
    c = sub.add_parser("cad-steps")
    c.add_argument("--id", required=True)
    c.add_argument("--cache", required=True)
    c.add_argument("--out", required=True)
    parsed = parser.parse_args()
    {"studio": studio, "cad-steps": cad_steps}[parsed.source](parsed)
