"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { LeadVideo } from "../_ui/lead-video";
import { Sheet, Wipe } from "./studio-parts";
import StageViewer from "./studio-stage";
import "./studio.css";

/* After the Studio page's text: what's in the app, one tab per part of the
   job (the feature tree, drawings, strength, toolpaths, sheet metal,
   assemblies), each a real screenshot or recording of Studio, then the
   linear stage from Amy's assembly demo to turn over in 3D.

   Sources, all Amy's own: studio-params-1/2.png (the flange before and after
   a bolt circle), studio-drawing-screenshot.png, simulate.mp4 (from her post),
   studio-post-cnc.png and studio-post-sheetmetal.png (cropped to the CAM and
   CAD windows, leaving out the tabs and chat that carry demo part numbers),
   and studio-post-crochet-true.png. Nothing here names a customer. */

type Tab = { id: string; label: string; title: string; text: string; note: string };

const TABS: Tab[] = [
  {
    id: "tree", label: "Feature tree", title: "Flange, one number changed",
    text: "Every part is a history you can read: sketches, extrudes, holes, patterns. The geometry is build123d on OpenCASCADE, with my own feature tree on top, so any step can be opened and changed by hand. Here the bolt circle's count goes from 6 to 8, and the holes rebuild around a 60 mm circle.",
    note: "Drag: 6 holes / 8 holes",
  },
  {
    id: "drawing", label: "Drawings", title: "Pillow block for a 608 bearing",
    text: "Engineering drawings come from the model: views, a section, GD&T and a title block. A reviewer's redline goes in as a sentence (flatness 0.05 on datum A) and the drawing is updated.",
    note: "Rev E, A3, third angle",
  },
  {
    id: "fea", label: "Strength", title: "Strength under load",
    text: "Strength checks run on the model itself: Netgen meshes it and CalculiX solves it, so you see where it bends and where the stress gathers before anything is made.",
    note: "Netgen + CalculiX",
  },
  {
    id: "cam", label: "CAM", title: "Motor mount, two setups on a mill",
    text: "Toolpaths and machine programs come from FreeCAD's CAM: this one is 14 operations and 6 tools, about 48 minutes of facing, pocketing, drilling and tapping. Studio says plainly that a program hasn't been proven on a machine yet.",
    note: "FreeCAD CAM",
  },
  {
    id: "sheet", label: "Sheet metal", title: "Controller enclosure",
    text: "Sheet metal parts are built in the same feature tree, in a real material, with vents, cut-outs and flanges, and get a flat pattern and bend table on the drawing.",
    note: "5052 aluminium",
  },
  {
    id: "assembly", label: "Assemblies", title: "Single-hook crochet machine",
    text: "Assemblies come in as STEP files with every part named, so a machine of dozens of parts reads like a parts list, not a lump.",
    note: "Imported STEP",
  },
];

function Panel({ id }: { id: string }) {
  const img = (src: string, alt: string, w: number, h: number) => (
    <div className="st-shot" style={{ aspectRatio: `${w} / ${h}` }}>
      <Image src={src} alt={alt} fill sizes="(min-width: 860px) 760px, 100vw" />
    </div>
  );
  switch (id) {
    case "tree":
      return (
        <Wipe ratio="5 / 4" label="The flange with 6 holes and with 8" beforeLabel="Count 6" afterLabel="Count 8" sweep={false}
          before={<Image src="/software/studio/params-before.webp" alt="Studio with a flange and its Bolt Circle dialog: 6 holes of 6.6 mm on a 60 mm circle" fill sizes="(min-width: 860px) 760px, 100vw" />}
          after={<Image src="/software/studio/params-after.webp" alt="The same flange with the count changed to 8: eight holes on the same circle" fill sizes="(min-width: 860px) 760px, 100vw" />}
        />
      );
    case "drawing": return img("/software/studio/drawing-sheet.webp", "Studio showing an A3 drawing of an aluminium pillow block, with the reviewer's redline in the chat beside it", 1600, 1000);
    case "fea": return <LeadVideo src="/software/studio/simulate.mp4" poster="/software/studio/simulate.webp" width={1280} height={720} label="A strength check in Studio" className="st-shot st-shot-video" />;
    case "cam": return img("/software/studio/cam.webp", "Studio's CAM view: the operation list beside a block with its roughing, pocket and drilling toolpaths drawn on it", 1600, 1167);
    case "sheet": return img("/software/studio/sheet-metal.webp", "A sheet metal enclosure in Studio, with its feature tree of extrudes and cuts", 1600, 1169);
    default: return img("/software/studio/assembly.webp", "A crochet machine opened in Studio, its named parts listed down the side", 1600, 1000);
  }
}

export default function StudioTour() {
  const [at, setAt] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[at];
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (at + d + TABS.length) % TABS.length;
    setAt(n);
    tabs.current[n]?.focus();
  };
  return (
    <div className="st st-after">
      <section className="ui-try st-tour" aria-label="What's in Studio">
        <h2 className="st-head">What&apos;s in it</h2>
        <div className="st-tabs" role="tablist" aria-label="Parts of Studio" onKeyDown={onKey}>
          {TABS.map((t, i) => (
            <button
              key={t.id} ref={el => { tabs.current[i] = el; }} type="button" role="tab" id={`st-tab-${t.id}`} aria-controls="st-panel"
              aria-selected={i === at} tabIndex={i === at ? 0 : -1} className="ui-try-pill st-tab" onClick={() => setAt(i)}
            >
              <span className="st-tab-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{t.label}
            </button>
          ))}
        </div>
        <div id="st-panel" role="tabpanel" aria-labelledby={`st-tab-${tab.id}`}>
          <Sheet fig={`2.${at + 1}`} title={tab.title} note={tab.note}>
            <div className="st-panel-media" key={tab.id}><Panel id={tab.id} /></div>
          </Sheet>
          <p className="st-panel-text" key={`t-${tab.id}`}>{tab.text}</p>
        </div>
      </section>
      <StageViewer />
    </div>
  );
}
