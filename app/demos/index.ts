import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/* The mini demos, one per project page that has one, keyed by slug. Each is
   its own client component in this folder, loaded as its own chunk, so a page
   only downloads its own demo. Anything heavy (three.js, a face tracker) is
   imported inside the demo on first use, not here.

   Where it sits: a software page leads with its demo (the software itself
   first) and its demo video moves to just after the text; an object page
   keeps the photo of the real thing first, with the demo right under it.
   Every demo uses the shared .ui-try frame in globals.css: the stage, a row
   of pill controls, and a one-line soft caption starting "Try it:". */
export const demos: Record<string, ComponentType> = {
  "region-maps": dynamic(() => import("../software/region-try").then(m => m.RegionTry)),
  "smart-dropper": dynamic(() => import("./smart-dropper")),
  "cad-steps": dynamic(() => import("./cad-steps")),
  "selfie-booth": dynamic(() => import("./selfie-booth")),
  "cute-ghostty": dynamic(() => import("./cute-ghostty")),
  "lipflow": dynamic(() => import("./lipflow")),
  "folding-yoga-mat": dynamic(() => import("./folding-yoga-mat")),
  "ai-jewelry": dynamic(() => import("./ai-jewelry")),
  "harp-instrument": dynamic(() => import("./harp-instrument")),
  "clarinet-tuning-barrel": dynamic(() => import("./clarinet-tuning-barrel")),
  "lil-spider-maze": dynamic(() => import("./lil-spider-maze")),
};

/** Pages whose demo video is better than the mini demo: the video keeps the
    lead and the demo sits right under it. Amy asked for this on Lipflow,
    where her own video shows the real lip reading. */
export const videoFirst = new Set(["lipflow"]);
