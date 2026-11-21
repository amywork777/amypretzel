"use client";

import { Anatomy, type AnatomyPart } from "./case-study";

/* Studio, after its text: the whole window as a designer would show it, part
   by part (the Anatomy in case-study.tsx). anatomy.webp is one real moment
   from an isolated Studio on 2026-11-21: its motor mount plate example right
   after the chat asked for longer belt slots. Boxes and dots are percentages
   of that picture. */

const PARTS: AnatomyPart[] = [
  {
    title: "The chat sits beside the part",
    text: "The agent works in a column next to the model, never over it, so you watch the part change while you talk. Each answer ends with what changed and what is now out of date.",
    box: [0, 5.2, 18.75, 94.8], dot: [9.4, 21],
  },
  {
    title: "Files open as tabs",
    text: "Parts, the assembly and the requirements open side by side as tabs, with the project's overview always first, the way a CAD session holds several documents.",
    box: [19.2, 0, 39, 5.2], dot: [44, 2.6],
  },
  {
    title: "A ribbon engineers already know",
    text: "Features, Sketch, Evaluate and Drawing, with commands named the way SolidWorks names them. When it's quicker to change something by hand, the tool is where you'd look.",
    box: [18.8, 5.2, 81.2, 11.6], dot: [64, 11],
  },
  {
    title: "Every step is a feature",
    text: "What the AI built isn't a mesh, it's a history: an extrude, four cuts, a chamfer. Each one opens and changes like any other feature.",
    box: [18.8, 16.8, 16, 36.4], dot: [31, 27],
  },
  {
    title: "Tolerances live on the model",
    text: "Datums, toleranced sizes and notes sit on the part itself, so the requirements travel with the geometry into the STEP file.",
    box: [18.8, 53.2, 16, 46.8], dot: [31, 72],
  },
  {
    title: "Nothing floats over the part",
    text: "The model is always the latest build. A view cube in the corner and one short toolbar are all that sit on top of it.",
    box: [34.8, 16.8, 65.2, 83.2], dot: [86, 34],
  },
];

export default function StudioAnatomy() {
  return (
    <Anatomy
      id="st-anat" heading="The screen, part by part" ratio="16 / 10" parts={PARTS}
      lede="A chat and a full CAD workspace in one window. Point at a number to see why each part sits where it does."
      src="/software/studio/anatomy.webp" caption="Studio, right after the chat asked for longer belt slots"
      alt="Studio's whole window: the chat on the left, file tabs and the CAD ribbon along the top, the feature tree and tolerances down the side, and the motor mount plate in the middle."
    />
  );
}
