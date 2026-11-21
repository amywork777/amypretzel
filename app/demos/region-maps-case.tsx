"use client";

import { RegionTry } from "../software/region-try";
import { Anatomy, Details, type AnatomyPart, type Detail } from "./case-study";

/* Region Maps as a design case study, on the same pieces as Studio's page
   (case-study.tsx). Vizcom is a closed app, so every picture is a frame of
   its own launch film or tutorial recordings (public/software/region-maps/):
   the launch film leads the page (Amy prefers it to a still), anatomy.webp the editor while
   recolouring the chair (demo-2), the close-ups cut from the same clips.
   What each part says comes from those frames and the page's own text. */

const PARTS: AnatomyPart[] = [
  {
    title: "The render stays the thing you're looking at",
    text: "Double-clicking a part opens its editor right on the canvas. The part you're editing is outlined in place, and every change lands on the render itself.",
    box: [0, 21.7, 31.3, 78.3], dot: [15, 53],
  },
  {
    title: "Parts, found for you",
    text: "The render is split into regions automatically. All Regions / Region 1 says where you are, and the preview shows exactly which pixels this part covers.",
    box: [79.4, 6.4, 13.8, 23.6], dot: [86.3, 22.8],
  },
  {
    title: "A stack per part",
    text: "Each region keeps its colours and materials as layers, each with its own visibility, so comparing options is switching layers, not repainting.",
    box: [79.4, 31.2, 13.8, 16.1], dot: [86.3, 39],
  },
  {
    title: "Colour or image, one picker",
    text: "Pick a colour by eye or by hex, or switch to Image to lay a material or pattern on the part, in the same place.",
    box: [64.9, 6.4, 14, 51], dot: [71.8, 19.5],
  },
  {
    title: "The light stays on",
    text: "A new colour blends in Color mode by default, so it keeps the render's folds, highlights and texture instead of reading as paint on a photo.",
    box: [64.9, 58.4, 14, 8.4], dot: [63.6, 62.6],
  },
];

const DETAILS: Detail[] = [
  {
    src: "/software/region-maps/ui-split.webp", w: 649, h: 440, title: "Parts, not pixels",
    text: "Region Maps splits the render into Region 1 to Region 5 and the background on its own, so a designer starts from parts instead of painting masks.",
    alt: "A chair render with one region outlined, beside the Regions list: Region 1 to Region 5 and Background, each with its colour",
  },
  {
    src: "/software/region-maps/ui-selected.webp", w: 934, h: 947, title: "Choose a part by pointing at it",
    text: "The region you've picked is outlined on the render itself, so you always know which part you're about to change.",
    alt: "The chair's shell outlined with a dashed selection on the canvas",
  },
  {
    src: "/software/region-maps/ui-material.webp", w: 293, h: 390, title: "Every part keeps its own stack",
    text: "A region's preview shows exactly what it covers; under it, its colours stack as layers you can hide, reorder or remove.",
    alt: "The Regions panel for Region 1: a preview of the chair's shell, and a material stack of two colours, 4E2D2D and 86A993",
  },
  {
    src: "/software/region-maps/ui-picker.webp", w: 296, h: 574, title: "Built to keep the light",
    text: "Color is the default blend, so recolouring keeps the render's shading; Affect layer below only keeps a change to one layer.",
    alt: "The colour picker: Color and Image tabs, a hex field, and Blend Mode set to Color with Affect layer below only",
  },
];

/** Under the launch film, which leads the page (videoFirst): the small version to try. */
export default function RegionMapsLead() {
  return <RegionTry />;
}

/** After the text: the editor part by part, then four details up close. */
export function RegionMapsAfter() {
  return (
    <div className="st st-after">
      <Anatomy
        id="rm-anat" heading="The editor, part by part" ratio="2112 / 948" parts={PARTS}
        lede="Region Maps lives on Vizcom's canvas: the render on the left, the part's colour and its regions on the right. Point at a number to see why each piece is there."
        src="/software/region-maps/anatomy.webp" caption="Recolouring a chair's shell, from the tutorial"
        alt="Vizcom with Region Maps open: a chair render recoloured red on the canvas, the colour picker, and the Regions panel with Region 1's material stack"
      />
      <Details
        id="rm-details" heading="Up close" details={DETAILS}
        lede="Four details of the editor, cut from the launch tutorial's recordings."
      />
    </div>
  );
}
