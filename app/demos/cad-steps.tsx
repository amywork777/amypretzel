"use client";

import { CadStepper, type CadSteps as Steps } from "./cad-stepper";
import part from "../../public/demos/cad-steps/steps.json";

/* One sample of the dataset, 00079619, state by state: every sketch and
   extrude of its construction sequence, each solid the STEP file the dataset
   holds for that state (replayed in OpenCascade), meshed as it is. Baked by
   scripts/make-cad-steps.py cad-steps --id 00079619. */

const VIEW = { azimuth: -52, elevation: 28 };

export default function CadSteps() {
  return (
    <CadStepper
      part={part as Steps}
      bin="/demos/cad-steps/steps.bin"
      still="/demos/cad-steps/still.webp"
      color="#bdbdbd"
      view={VIEW}
      object="Sample 00079619 from the CAD-Steps dataset"
      listLabel="Construction steps"
      caption={<>Try it: play the build, pick a step, or drag the part to turn it. This is sample 00079619 from the dataset, each state the geometry it holds for that step.</>}
    />
  );
}
