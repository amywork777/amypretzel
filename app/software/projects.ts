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
      "Launched product features for industrial designers. Only public, video-backed launches are listed here.",
    projects: [
      {
        slug: "extract",
        title: "Extract",
        meta: "AI extraction",
        summary:
          "A workbench block for pulling reusable colors, materials, parts, and visual references out of product images.",
        body: `Extract is a workbench block inside Vizcom Studio for pulling reusable pieces out of any product image — colors, materials, parts, and visual references you can drop straight back into your own work.

Industrial designers collect reference constantly, but reference images are frozen: the interesting leather texture is stuck to someone else's handbag. Extract un-freezes them. Point it at an image and it decomposes what it sees into elements you can reuse — a palette, a material swatch, an isolated part — each one ready to feed the next generation.

I designed and shipped Extract as a product engineer at **Vizcom**, from concept through launch. The demos below are from the public launch.`,
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
        body: `Smart Dropper is a canvas tool for absorbing visual style from one image and applying it to another — like an eyedropper, but for the feeling of an image instead of a single pixel's color.

Pick up the mood of a reference — its materials, lighting, finish — and paint it onto your own object while the target's geometry and identity stay put. It turns "make mine look like that" from a prompt-engineering exercise into one gesture.

I built Smart Dropper at **Vizcom** as part of the canvas toolset, covering the interaction design and the product engineering behind the tool.`,
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
        body: `Voice input lets designers talk to Vizcom's prompt surfaces instead of typing, and the language work makes prompts behave well in the many languages Vizcom's designers actually speak.

Speaking a change is faster than typing one mid-sketch, and it keeps hands free for drawing. Under the hood this meant streaming transcription wired into every prompt surface, plus handling for multilingual input so a prompt in Japanese or German works as well as one in English.

I shipped both as product features at **Vizcom**; the launch demo is below.`,
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
      "Systems for turning references, prompts, geometry, and manufacturing rules into usable design artifacts.",
    projects: [
      {
        slug: "taiyaki-3d",
        title: "Taiyaki 3D",
        meta: "Concept-to-CAD",
        summary:
          "An AI concept-to-CAD system for hardware teams, moving from sketches and references toward editable 3D geometry.",
        body: `Taiyaki 3D was an AI concept-to-CAD system for hardware teams: start from a sketch, a render, or a pile of reference images, and move toward editable 3D geometry instead of a static picture.

Most AI design tools stop at images. Hardware teams need geometry — things with dimensions, features, and intent that can survive contact with manufacturing. Taiyaki sat in that gap, translating early concepts into 3D starting points designers could keep working on.

I founded and built **Taiyaki**, covering the product, the geometry pipeline, and the interface. It also seeded the jewelry pipeline and much of my later CAD work.`,
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
        body: `Taiyaki Jewelry turned personal references — a sketch, a photo, a memory — into castable metal pieces through an AI-assisted design pipeline.

The pipeline moved from a customer's reference to a 3D sculpt, then through printability and castability checks, to a physical piece in silver or gold. The interesting problems were at the manufacturing end: wall thicknesses, sprues, and what a caster will actually accept.

I built the pipeline end to end and produced real commissioned pieces with it. It's the most literal version of "software that makes physical things" I've shipped.`,
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
        body: `CAD-Steps is a dataset of intermediate CAD construction states — not just finished models, but every step along the way — for training models on how geometry is actually built.

Most CAD datasets contain only final shapes, so models trained on them learn what objects look like but not how a designer constructs them. CAD-Steps uses OpenCascade to replay construction sequences and capture each intermediate state, producing step-by-step data for training and evaluation.

The dataset is public on Hugging Face, with the generation code on GitHub.`,
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
      "Small public tools, experiments, and side projects with a clear product surface.",
    projects: [
      {
        slug: "sf-rats",
        title: "SF Rats",
        meta: "Community map",
        summary:
          "A React, Leaflet, and Supabase app for finding and sharing free and free-ish Bay Area events on a live map.",
        body: `SF Rats is a live map of free and nearly-free things to do around the Bay Area — shows, festivals, museum free days, oddball community events — built with React, Leaflet, and Supabase.

The city is full of free joy that's scattered across newsletters and buried event pages. SF Rats puts it on one map, keeps it current, and lets anyone submit finds. Open contribution is the point: the map gets better because people who love free stuff feed it.

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
        body: `Cute Ghostty is a pastel makeover for the Ghostty terminal: themes, a custom app icon, install scripts, and a downloadable macOS build, packaged so making your terminal adorable takes one step.

Terminals are where many of us live all day, and they almost all look like cockpits. Cute Ghostty argues they can be soft and pink and still be serious tools. It resonated — the site and configs have made their way around the internet.

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

Demo videos usually mean recording, then twenty minutes in an editor adding zooms so viewers can follow the cursor. Screenie does that during capture — stop recording and the edited version is already on your clipboard, ready to paste into Slack or a PR.

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
