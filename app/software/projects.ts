export type SoftwareDemo = {
  label: string;
  src: string;
};

export type SoftwareProject = {
  slug: string;
  title: string;
  meta: string;
  summary: string;
  body: string;
  tags?: string[];
  demos?: SoftwareDemo[];
  links?: { label: string; href: string }[];
};

export type SoftwareSection = {
  title: string;
  summary: string;
  projects: SoftwareProject[];
};

export const softwareSections: SoftwareSection[] = [
  {
    title: "Vizcom",
    summary:
      "Product features for industrial designers. Only public launches with videos are listed.",
    projects: [
      {
        slug: "extract",
        title: "Extract",
        meta: "AI extraction",
        summary:
          "A workbench block for pulling reusable colors, materials, parts, and visual references out of product images.",
        body: `Extract is a workbench block in Vizcom Studio that pulls reusable pieces out of a product image: colors, materials, parts, and visual references you can drop back into your own work.

Designers collect reference constantly, but a reference image is frozen. The leather texture you like is stuck to someone else's bag. Extract breaks the image into elements you can reuse, each one ready to feed the next generation.

I designed and shipped it at Vizcom, from concept through launch. The demos below are from the public launch.`,
        tags: ["Product feature", "Industrial design", "AI workflow"],
        demos: [
          {
            label: "Launch",
            src: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7444813978851250176?compact=1",
          },
          {
            label: "Walkthrough",
            src: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7448804353336958976?compact=1",
          },
        ],
      },
      {
        slug: "smart-dropper",
        title: "Smart Dropper",
        meta: "Style transfer",
        summary:
          "A canvas tool for absorbing visual style from one image and applying it to another while preserving the target object.",
        body: `Smart Dropper is a canvas tool that picks up the look of one image and applies it to another. It works like an eyedropper, but for materials, lighting, and finish instead of a single color.

Pick up a reference, paint it onto your own object, and the object's shape and identity stay put. "Make mine look like that" becomes one gesture instead of a prompt to fiddle with.

I built it at Vizcom as part of the canvas toolset, covering the interaction design and the product engineering.`,
        tags: ["Product feature", "Canvas UX", "Style transfer"],
        demos: [
          {
            label: "Demo",
            src: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7456926108953772032?compact=1",
          },
          {
            label: "Follow-up",
            src: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7458733876840910849?compact=1",
          },
        ],
      },
      {
        slug: "voice-input",
        title: "Voice input and language",
        meta: "Prompt UX",
        summary:
          "Voice input and language handling for faster generation across Vizcom prompt surfaces.",
        body: `Voice input lets designers talk to Vizcom's prompt surfaces instead of typing, and the language work makes prompts behave well in the languages Vizcom's designers actually speak.

Speaking a change mid-sketch is faster than typing it, and it keeps your hands free for drawing. A prompt in Japanese or German should work as well as one in English.

I shipped both as product features at Vizcom. The launch demo is below.`,
        tags: ["Product feature", "Prompting", "Input UX"],
        demos: [
          {
            label: "Voice input",
            src: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7450253895211315200?compact=1",
          },
        ],
      },
    ],
  },
  {
    title: "AI and CAD",
    summary:
      "Turning sketches, references, and manufacturing rules into geometry you can actually use.",
    projects: [
      {
        slug: "taiyaki-3d",
        title: "Taiyaki 3D",
        meta: "Concept-to-CAD",
        summary:
          "An AI concept-to-CAD system for hardware teams, moving from sketches and references toward editable 3D geometry.",
        body: `Taiyaki 3D was an AI concept-to-CAD system for hardware teams. Start from a sketch, a render, or a pile of reference images, and end up with editable 3D geometry instead of a static picture.

Most AI design tools stop at images. Hardware teams need geometry with dimensions and features that can survive manufacturing. Taiyaki turned early concepts into 3D starting points a designer could keep working on.

I founded Taiyaki and built the product, the geometry pipeline, and the interface. It seeded the jewelry pipeline and most of my later CAD work.`,
        tags: ["AI CAD", "3D generation", "Hardware workflows"],
        links: [
          { label: "Project page", href: "/portfolio/taiyaki-3d" },
          { label: "Launch post", href: "https://www.linkedin.com/feed/update/urn:li:activity:7291166105191034880/" },
        ],
      },
      {
        slug: "taiyaki-jewelry",
        title: "Taiyaki Jewelry",
        meta: "AI jewelry pipeline",
        summary:
          "A sketch/photo-to-jewelry workflow for turning personal references into castable metal pieces.",
        body: `Taiyaki Jewelry turned a personal reference (a sketch, a photo, a memory) into a castable metal piece through an AI-assisted design pipeline.

The pipeline went from the customer's reference to a 3D sculpt, through printability and castability checks, to a finished piece in silver or gold. The interesting problems were at the manufacturing end: wall thickness, sprues, and what a caster will actually accept.

I built the pipeline end to end and made real commissioned pieces with it. It is the most literal version of software that makes physical things I have shipped.`,
        tags: ["AI CAD", "Jewelry", "Manufacturing"],
        links: [
          { label: "Project page", href: "/portfolio/ai-jewelry" },
          { label: "Launch post", href: "https://www.linkedin.com/feed/update/urn:li:activity:7340491665603772416/" },
        ],
      },
      {
        slug: "cad-steps",
        title: "CAD-Steps",
        meta: "CAD dataset",
        summary:
          "A dataset of intermediate CAD construction states for training models on step-by-step geometry creation instead of final shapes only.",
        body: `CAD-Steps is a dataset of intermediate CAD construction states. Not just finished models, but every step along the way, for training models on how geometry actually gets built.

Most CAD datasets only contain final shapes, so models trained on them learn what objects look like but not how a designer constructs them. CAD-Steps uses OpenCascade to replay construction sequences and capture each intermediate state.

The dataset is on Hugging Face and the generation code is on GitHub.`,
        tags: ["Dataset", "OpenCascade", "Python"],
        links: [
          { label: "GitHub", href: "https://github.com/amywork777/cad-steps-dataset" },
          { label: "Dataset", href: "https://huggingface.co/datasets/amzyst1/cad-steps" },
        ],
      },
    ],
  },
  {
    title: "Tools and toys",
    summary:
      "Small public tools and side projects.",
    projects: [
      {
        slug: "sf-rats",
        title: "SF Rats",
        meta: "Community map",
        summary:
          "A React, Leaflet, and Supabase app for finding and sharing free and free-ish Bay Area events on a live map.",
        body: `SF Rats is a live map of free and nearly free things to do around the Bay Area: shows, festivals, museum free days, odd community events. Built with React, Leaflet, and Supabase.

The good free stuff is scattered across newsletters and buried event pages. SF Rats puts it on one map, keeps it current, and lets anyone submit a find. The map gets better because people who love free things feed it.

Live app and source below.`,
        tags: ["React", "Leaflet", "Supabase"],
        links: [
          { label: "Live app", href: "https://sfrats-map.vercel.app" },
          { label: "GitHub", href: "https://github.com/amywork777/SFRATS" },
        ],
      },
      {
        slug: "cute-ghostty",
        title: "Cute Ghostty",
        meta: "Terminal customization",
        summary:
          "A cute Ghostty distribution and config pack with pastel themes, a custom app icon, install scripts, and a downloadable macOS build.",
        body: `Cute Ghostty is a pastel makeover for the Ghostty terminal: themes, a custom app icon, install scripts, and a downloadable macOS build, packaged so it takes one step.

Terminals are where a lot of us live all day, and almost all of them look the same. This one is soft and pink and still a serious tool.

Website and GitHub below.`,
        tags: ["macOS", "Shell", "Design system"],
        links: [
          { label: "Website", href: "https://cute-ghostty.vercel.app" },
          { label: "GitHub", href: "https://github.com/amywork777/CuteGhostty" },
        ],
      },
      {
        slug: "screenie",
        title: "Screenie",
        meta: "macOS recorder",
        summary:
          "A Swift screen recorder that automatically adds click zooms, cursor tracking, speed ramps, and copies the edited recording to the clipboard.",
        body: `Screenie is a macOS screen recorder written in Swift that edits the recording for you: automatic click zooms, cursor tracking, speed ramps, and the finished clip copied straight to your clipboard.

A demo video usually means recording, then twenty minutes in an editor adding zooms so people can follow the cursor. Screenie does that during capture. Stop recording and the edited clip is already on your clipboard, ready to paste into Slack or a PR.

Website and source below.`,
        tags: ["Swift", "macOS", "Video tooling"],
        links: [
          { label: "Website", href: "https://landing-two-phi-66.vercel.app" },
          { label: "GitHub", href: "https://github.com/amywork777/Screenie" },
        ],
      },
    ],
  },
];

export const softwareProjects = softwareSections.flatMap((section) =>
  section.projects.map((project) => ({ ...project, section: section.title }))
);
