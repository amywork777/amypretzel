"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { LeadVideo } from "../_ui/lead-video";
import { Sheet, Wipe } from "./studio-parts";
import StudioPrinciples from "./studio-principles";
import StageViewer from "./studio-stage";
import "./studio.css";

/* After the Studio page's text: the engineer's job step by step, a tab per
   thing they are trying to get done, grouped into the phases of getting a
   part made, then the linear stage from Amy's assembly demo to turn over in
   3D. Framed as the engineer's job, not the app's outputs (Amy, 2026-11-21:
   "focused more on the entire user experience and goals of the app"): what
   they want, what they do, and what Studio does.

   Sources. change, versions, fit and cnc-check were captured
   on 2026-11-21 from an isolated Studio (its own home, projects and ports)
   running Studio's own motor mount plate example: one real chat that checked
   it for CNC, lengthened its belt slots from 10 to 15 mm and checked the fit
   in its assembly. Every figure in the copy below is from those runs. The
   rest are Amy's own: plate-drawing/plate-cad (the halves of her tweet-plate.png),
   studio-drawing-screenshot.png, simulate.mp4 (from her
   post), studio-post-cnc.png and studio-post-sheetmetal.png (cropped to the
   CAM and CAD windows, leaving out tabs and chat that carry demo part
   numbers). Nothing here names a customer. */

type Phase = "Shape it" | "Check it" | "Make it";
type Tab = { id: string; phase: Phase; label: string; want: string; you: string; studio: string; title: string; note: string };

const TABS: Tab[] = [
  {
    id: "from-drawing", phase: "Shape it", label: "Start from a drawing", title: "Bent plate, from an old hand drawing", note: "Drag to compare",
    want: "All I have is an old pencil drawing.",
    you: "Attach a photo of it.",
    studio: "Reads every dimension it can (R 4.000 lip, R .06 bends, a .500 joggle) and builds the part. The thickness wasn't on the drawing, so T .051 is worked out from the rest and marked as derived.",
  },

  {
    id: "change", phase: "Shape it", label: "Change it", title: "Motor mount plate, slots made longer", note: "Asked in words",
    want: "The belt needs more room to tension.",
    you: "Say what to change: give the belt slots 15 mm of travel instead of 10, on the same 80 mm spacing.",
    studio: "Changes the model, checks it again for CNC and updates the STEP and the requirements. Then it says what is now out of date: the drawing, CAM and strength results need redoing before it's made.",
  },
  {
    id: "versions", phase: "Shape it", label: "Compare versions", title: "Motor plate, Version 1 to Version 2", note: "Slot length 10 to 15 mm",
    want: "I want to try things without losing what worked.",
    you: "Keep working. Each change the agent makes is kept as a version.",
    studio: "Compares any two versions on the model and in numbers: here the slots went from 10 to 15 mm and the plate lost 330 mm³, with the removed material marked.",
  },
  {
    id: "fit", phase: "Shape it", label: "Fit it to the rest", title: "Motor mount: plate, NEMA 17 and four M3 screws", note: "No interference",
    want: "It still has to fit the motor and its screws.",
    you: "Ask whether the plate still fits in its assembly.",
    studio: "Measures every pair of parts: no interference, 0.20 mm round each M3 screw, the heads exactly flush. And it says what the model can't settle: the stand-in motor's pilot is undersized, so measure the real one.",
  },
  {
    id: "fea", phase: "Check it", label: "Will it hold?", title: "Strength under load", note: "Netgen + CalculiX",
    want: "Before I make it, I need to know it won't bend or break.",
    you: "Put a load on the part.",
    studio: "Meshes the model itself with Netgen and solves it with CalculiX, then shows where it bends and where the stress gathers, while a change is still cheap.",
  },
  {
    id: "cnc", phase: "Check it", label: "Can it be made?", title: "Motor plate, 3-axis CNC in 6061-T6", note: "Geometry passes",
    want: "Can a shop actually mill this?",
    you: "Tap Check for CNC machining under the chat.",
    studio: "Checks tool access, inside corners, thin walls and setups on the model: the geometry passes, the stock and setup plan need fixing. It also lists what it didn't check, like holder and fixture clearance.",
  },

  {
    id: "drawing", phase: "Make it", label: "Get it signed off", title: "Pillow block for a 608 bearing", note: "Rev E, A3, third angle",
    want: "Someone else has to review it before it's made.",
    you: "Send the drawing out, then type the reviewer's redline back as a sentence: flatness 0.05 on datum A.",
    studio: "Makes the drawing from the model, with views, a section, GD&T and a title block, and updates it from the redline.",
  },
  {
    id: "cam", phase: "Make it", label: "Machine it", title: "Motor mount, two setups on a mill", note: "FreeCAD CAM",
    want: "I want a program I can take to the mill.",
    you: "Ask for the setups and toolpaths.",
    studio: "Plans them with FreeCAD's CAM: here 14 operations and 6 tools, about 48 minutes of facing, pocketing, drilling and tapping. It says plainly that the program hasn't been proven on a machine yet.",
  },
  {
    id: "sheet", phase: "Make it", label: "Bend it", title: "Controller enclosure", note: "5052 aluminium",
    want: "This one is folded from sheet, not cut from a block.",
    you: "Pick a real material and add the vents, cut-outs and flanges.",
    studio: "Keeps them in the same feature tree, and puts the flat pattern and bend table on the drawing for the shop.",
  },
];
const PHASES: Phase[] = ["Shape it", "Check it", "Make it"];

function Panel({ id }: { id: string }) {
  // Every step's picture is fitted into the same 16:10 stage, so the frame
  // holds still while the steps change; w and h are the file's own size.
  const img = (src: string, alt: string, w: number, h: number) => (
    <div className="st-shot" data-fit={Math.abs(w / h - 1.6) > 0.02 ? "contain" : undefined}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1200px) 880px, 100vw" />
    </div>
  );
  switch (id) {
    case "from-drawing":
      return (
        <Wipe ratio="8 / 9" label="Bent plate: drawing to CAD" beforeLabel="Drawing" afterLabel="Studio CAD" sweep={false}
          before={<Image src="/software/studio/plate-drawing.webp" alt="A photo of an old pencil drawing of a bent plate, dimensioned in fractions of an inch" fill sizes="(min-width: 1200px) 500px, 90vw" />}
          after={<Image src="/software/studio/plate-cad.webp" alt="The CAD model Studio made from it, with callouts: R 4.000 lip, R 2.125 lip, R .06 bends, .500 joggle, T .051 derived" fill sizes="(min-width: 1200px) 500px, 90vw" />}
        />
      );
    case "change": return img("/software/studio/change.webp", "Studio with the chat beside the motor plate: the request for 15 mm slots, what changed, and the rebuilt plate with its feature tree", 1600, 1000);
    case "versions": return img("/software/studio/versions.webp", "Studio comparing Version 1 and Version 2 of the motor plate: the material removed at both slots marked on the model, slot length 10 to 15 mm, volume down 330 cubic mm", 1600, 1000);
    case "fit": return img("/software/studio/fit.webp", "Studio's fit check beside the motor mount assembly: no interference, a table of measured clearances for the pilot, the M3 screws and their heads", 1600, 1000);
    case "cnc": return img("/software/studio/cnc-check.webp", "Studio's CNC check beside the motor plate: it passes for tool access, inside corners and thin walls, with setups still to check", 1600, 1000);
    case "drawing": return img("/software/studio/drawing-sheet.webp", "Studio showing an A3 drawing of an aluminium pillow block, with the reviewer's redline in the chat beside it", 1600, 1000);
    case "fea": return <LeadVideo src="/software/studio/simulate.mp4" poster="/software/studio/simulate.webp" width={1280} height={720} label="A strength check in Studio" className="st-shot st-shot-video" />;
    case "cam": return img("/software/studio/cam.webp", "Studio's CAM view: the operation list beside a block with its roughing, pocket and drilling toolpaths drawn on it", 1600, 1167);
    default: return img("/software/studio/sheet-metal.webp", "A sheet metal enclosure in Studio, with its feature tree of extrudes and cuts", 1600, 1169);
  }
}

export default function StudioTour() {
  const [at, setAt] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[at];
  const go = (n: number) => { setAt(n); tabs.current[n]?.focus(); };
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    go((at + d + TABS.length) % TABS.length);
  };
  return (
    <div className="st st-after">
      <StudioPrinciples />
      <section className="st-wide st-tour" aria-labelledby="st-tour-h">
        <header className="st-chapter">
          <h2 id="st-tour-h" className="st-head">The job, step by step</h2>
          <p className="st-lede">From an old drawing to the shop, most of it on one motor mount plate: what the engineer wants, what they do, and what Studio does.</p>
        </header>
        <div className="st-tour-body">
          <div className="st-tabs" role="tablist" aria-label="Steps of the job" aria-orientation="vertical" onKeyDown={onKey}>
            {PHASES.map(ph => (
              <div key={ph} className="st-phase" role="presentation">
                <span className="st-phase-name" aria-hidden="true">{ph}</span>
                <div className="st-phase-tabs" role="presentation">
                  {TABS.map((t, i) => t.phase !== ph ? null : (
                    <button
                      key={t.id} ref={el => { tabs.current[i] = el; }} type="button" role="tab" id={`st-tab-${t.id}`} aria-controls="st-panel"
                      aria-selected={i === at} tabIndex={i === at ? 0 : -1} className="ui-try-pill st-tab" onClick={() => setAt(i)}
                    >
                      <span className="st-tab-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div id="st-panel" role="tabpanel" aria-labelledby={`st-tab-${tab.id}`} className="st-step">
            <Sheet title={tab.title} note={tab.note}>
              <div className="st-panel-media" key={tab.id}><Panel id={tab.id} /></div>
            </Sheet>
            <div className="st-step-side" key={`t-${tab.id}`}>
              <p className="st-step-want">&ldquo;{tab.want}&rdquo;</p>
              <dl className="st-spec">
                <div><dt>You</dt><dd>{tab.you}</dd></div>
                <div><dt>Studio</dt><dd>{tab.studio}</dd></div>
              </dl>
              <div className="st-step-nav">
                <button type="button" className="ui-try-reset" disabled={at === 0} onClick={() => setAt(at - 1)}>Previous step</button>
                <button type="button" className="ui-try-reset" disabled={at === TABS.length - 1} onClick={() => setAt(at + 1)}>Next step</button>
                <span className="st-step-count" aria-hidden="true">{at + 1} / {TABS.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <StageViewer />
    </div>
  );
}
