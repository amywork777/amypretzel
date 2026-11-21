"use client";

import Image from "next/image";
import { useState } from "react";
import { Sheet, Wipe } from "./studio-parts";
import "./studio.css";

/* Studio, under its build film: a reference drawing beside the CAD Studio
   made from it, with a handle to wipe from one to the other. Both pairs are
   the halves of Amy's own posts (tweet-plate.png and tweet-mold.png on her
   desktop, 2026-11-20), cut down the middle: the reference on the left, the
   Studio model on the right with her callouts. The plate's part number was
   already blurred out of the scan in the post; nothing else here names a
   customer or a part. What each side says comes from those callouts. */

type Case = {
  id: "plate" | "mold";
  label: string;
  title: string;
  from: string;
  read: string[];
  asked: string;
};

const CASES: Case[] = [
  {
    id: "plate",
    label: "Hand drawing",
    title: "Bent plate, from an old hand drawing",
    from: "A photo of an old pencil drawing, dimensioned in fractions of an inch.",
    read: ["R 4.000 lip, .4375 tall", "R 2.125 lip, .200 tall", "R .06 bends", ".500 joggle"],
    asked: "The thickness. T .051 is derived from the other dimensions, and marked as derived.",
  },
  {
    id: "mold",
    label: "Mold drawing",
    title: "Two-part mold, from a three-view drawing",
    from: "Front, right and bottom views and an isometric, in inches.",
    read: ["Cavity as one ellipsoid, Ø3.00 × 3.50", "Two halves and their pin holes", "Lead casting ≈ 5.3 lb, from the volume"],
    asked: "The cavity depth. 1.75 deep is called out as not on the drawing, so it gets checked.",
  },
];

export default function StudioFromDrawing() {
  const [id, setId] = useState<Case["id"]>("plate");
  const c = CASES.find(x => x.id === id)!;
  return (
    <section className="ui-try st st-from" aria-label="Reference drawing compared with the CAD Studio made">
      <div className="st-from-grid">
        <Sheet fig={id === "plate" ? "1a" : "1b"} title={c.title} note="Drag to compare">
          {CASES.map(x => (
            <div key={x.id} className="st-from-pair" hidden={x.id !== id}>
              <Wipe
                ratio="8 / 9"
                label={`${x.title}: drawing to CAD`}
                beforeLabel="Drawing"
                afterLabel="Studio CAD"
                sweep={x.id === "plate"}
                before={<Image src={`/software/studio/${x.id}-drawing.webp`} alt={`The reference: ${x.from}`} fill sizes="(min-width: 860px) 460px, 100vw" priority={x.id === "plate"} />}
                after={<Image src={`/software/studio/${x.id}-cad.webp`} alt={`The CAD model Studio made, with callouts: ${x.read.join(", ")}`} fill sizes="(min-width: 860px) 460px, 100vw" />}
              />
            </div>
          ))}
        </Sheet>
        <div className="st-from-side">
          <div className="ui-try-row" role="group" aria-label="Which drawing">
            {CASES.map(x => (
              <button key={x.id} type="button" className="ui-try-pill" aria-pressed={x.id === id} onClick={() => setId(x.id)}>{x.label}</button>
            ))}
          </div>
          <dl className="st-spec" key={id}>
            <div><dt>In</dt><dd>{c.from}</dd></div>
            <div><dt>Read</dt><dd><ul>{c.read.map(r => <li key={r}>{r}</li>)}</ul></dd></div>
            <div><dt>Not on it</dt><dd>{c.asked}</dd></div>
            <div><dt>Out</dt><dd>A feature-tree model you can dimension, edit and export.</dd></div>
          </dl>
        </div>
      </div>
      <p className="ui-try-caption">Try it: drag across each picture. Both are real: the reference on the left and the model Studio built from it on the right, with my callouts, cut from my posts.</p>
    </section>
  );
}
