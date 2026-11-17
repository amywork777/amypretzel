"use client";

import { CadStepper, type CadSteps } from "./cad-stepper";
import part from "../../public/demos/studio/steps.json";

/* Studio's sample motor plate, built feature by feature. The features are the
   ones Studio's own feature tree shows for parts/motor_plate.py in its Motor
   mount plate sample project (traced by Studio's edit tracer), and each solid
   is the body after that feature, as its rollback bar shows it. Baked by
   scripts/make-cad-steps.py studio. The colour is the one the part's script
   gives it. */

const VIEW = { azimuth: -58, elevation: 34 };

export default function StudioSteps() {
  return (
    <CadStepper
      part={part as CadSteps}
      bin="/demos/studio/steps.bin"
      still="/demos/studio/still.webp"
      color="#b9c0c8"
      view={VIEW}
      object="Studio's sample motor plate for a NEMA 17 stepper"
      listLabel="Feature tree"
      caption={<>Try it: play the build, pick a feature, or drag the plate to turn it. These are the features Studio&rsquo;s own tree lists for its sample motor plate, each solid the body at that point.</>}
    />
  );
}
