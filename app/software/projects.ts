export type SoftwareDemo = {
  label: string;
  src: string;
  /** Where the caption links; defaults to src. */
  href?: string;
  /** Frame height in px; defaults to 560, which suits a LinkedIn post. */
  height?: number;
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
  /** Photos shown in pairs after the text, e.g. the real thing in use. An
      .mp4 plays as a short muted loop, with the .webp of the same name as
      its poster. */
  photos?: string[];
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
        slug: "region-maps",
        title: "Region Maps",
        meta: "Color and material",
        summary:
          "Splits a product render into parts so each one's color, material, and pattern can be edited without re-rendering.",
        body: `Region Maps splits a product render into its parts, then lets you change the color, material, and pattern of each part without re-rendering or leaving Vizcom. The loop above is from the launch video, and under it is a small version you can try, made from a frame of the same video.

Colorways are decided part by part: this strap in leather, that shell in matte black, the trim in brass. Before, that meant exporting the render and painting it somewhere else, then painting it again for every option. I built Region Maps at Vizcom together with our designer, from splitting the render into regions to the editor for each one.

## The engineering problem

A render is a picture, not a model. There is no list of parts to recolor, only pixels, and a new color has to keep the folds, highlights and texture the render already has, or it reads as paint on a photo. So the work was in two places: finding the parts, and changing one without disturbing the light on it.

### How it went

- The render is split into regions automatically, and each one gets its own material, color and pattern controls
- An automatic split is never exactly where a designer would draw the line, so every region's mask can be added to or subtracted from by hand
- Double-clicking a region opens its editor right on the canvas, so the render stays the thing you're looking at
- Patterns repeat across a part, so the editor repairs texture seams to keep the repeat clean

It launched publicly with a video and a full tutorial, both below, with two short clips of the steps.`,
        tags: ["Product feature", "Color and material", "Canvas UX"],
        links: [
          { label: "Try it in Vizcom", href: "https://app.vizcom.com" },
          { label: "Docs", href: "https://docs.vizcom.com/region-maps" },
        ],
        demos: [
          {
            label: "Launch",
            src: "https://www.youtube.com/embed/OFmNJiZ4lYQ",
            href: "https://www.youtube.com/watch?v=OFmNJiZ4lYQ",
            height: 430,
          },
          {
            label: "Tutorial",
            src: "https://www.youtube.com/embed/jlTEjWh_4V8",
            href: "https://www.youtube.com/watch?v=jlTEjWh_4V8",
            height: 430,
          },
          {
            label: "Splitting a render into regions",
            src: "/software/region-maps/demo-1.mp4",
            href: "https://docs.vizcom.com/region-maps",
          },
          {
            label: "Editing a region's color",
            src: "/software/region-maps/demo-2.mp4",
            href: "https://docs.vizcom.com/region-maps",
          },
        ],
      },
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
        links: [
          { label: "Try it in Vizcom", href: "https://app.vizcom.com" },
          { label: "Docs", href: "https://docs.vizcom.com/extract" },
        ],
        demos: [
          {
            label: "Launch",
            src: "/software/extract/launch.mp4",
            href: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7444813978851250176/",
          },
          {
            label: "Walkthrough",
            src: "/software/extract/walkthrough.mp4",
            href: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7448804353336958976/",
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
        links: [
          { label: "Try it in Vizcom", href: "https://app.vizcom.com" },
          { label: "Docs", href: "https://docs.vizcom.com/tools/smart-dropper" },
        ],
        demos: [
          {
            label: "Follow-up",
            src: "/software/smart-dropper/demo.mp4",
            href: "https://www.linkedin.com/feed/update/urn:li:ugcPost:7458733876840910849/",
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

I shipped both as product features at Vizcom. The launch demo is at the top.`,
        tags: ["Product feature", "Prompting", "Input UX"],
        links: [
          { label: "Try it in Vizcom", href: "https://app.vizcom.com" },
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
        slug: "studio",
        title: "Studio",
        meta: "AI CAD app",
        summary:
          "A free, open-source AI CAD app for mechanical engineers: describe a part, get a real feature-tree model, then test it and send it to be made.",
        body: `Studio is a free, open-source CAD app for mechanical engineers, on Mac and Windows. Describe a part, or hand it a sketch or an old drawing, and the AI builds a real CAD model with a feature tree. From there you work the way engineers already do with a colleague's model: read it, change it, check it and send it to be made, without leaving the app.

I designed and built Studio end to end, in the open: what sits where on the screen, the words it uses, the rules every change is held to, and the code under all of it. Its CAD runs on text-to-cad, Jake's (earthtojake on GitHub) open-source CAD skills for AI agents.

## The design problem

Most AI apps are built for code, and most AI 3D tools make meshes: a shape you can look at but can't dimension, edit or send to a machine shop. Engineers work in feature trees, in CAD they've used for years, and they put their name on what gets made. A part that looks right in a chat can still be too thin to machine or collide with the part it mates to. So the AI can't have the last word, and the interface's job is to keep the engineer in charge without asking them to learn a new tool. Three goals came out of that:

- Keep the engineer in charge. The AI drafts and you decide: every step sits in the feature tree, and anything it had to assume is written down so you know what to check
- Get all the way to a made part. Checks, drawings and toolpaths sit next to the model, so "will it hold?" and "can it be made?" get asked while a change is still cheap
- Keep the work your own. It runs on your own Claude or ChatGPT account, so there's no extra AI bill, and every project is an ordinary folder on your computer

### How it went

- The model sits beside the chat, never under it, so you watch the part change while you talk, and fix a step in words or by hand, whichever is faster
- The layout comes from SolidWorks, which most engineers learned on: the ribbon, the FeatureManager and the view cube are where they expect, so the only new thing on screen is the AI
- I wrote the interface's rules down as laws that every change is checked against, a few of them by lint: engineering words rather than git's, colour only for passed, warning and failed, no made-up numbers
- Changing a number rebuilds from that step, so you steer a design instead of re-rolling it
- It says what it doesn't know: a derived dimension is labelled derived, and a machine program that hasn't been run on a machine is labelled unproven
- Each change is saved as a version, so trying an idea never costs you the last good one
- Under it: build123d and OpenCASCADE for the geometry, with my own feature tree on top; Netgen and CalculiX for strength checks; FreeCAD for toolpaths

It's free at texttocad.studio.`,
        tags: ["AI CAD", "Desktop app", "Open source"],
        links: [
          { label: "texttocad.studio", href: "https://texttocad.studio" },
          { label: "GitHub", href: "https://github.com/amywork777/studio" },
          { label: "text-to-cad", href: "https://github.com/earthtojake/text-to-cad" },
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
        slug: "lipflow",
        title: "Lipflow",
        meta: "Silent dictation",
        summary:
          "Dictation without sound: hold a key, silently mouth the words, and a local lip reader types them at your cursor. 700+ stars on GitHub.",
        body: `Lipflow is Wispr Flow for your lips. Hold a key, silently mouth what you want to say, let go, and the text appears at your cursor in whatever app you're in. It uses the webcam, not the microphone, and everything runs locally on a Mac, Windows PC, or Linux machine.

Voice dictation is fast, but you can't use it in an open office, on a train, or next to someone sleeping. Lip reading works anywhere you can sit in front of a camera.

While you mouth the words, it tracks your face, crops your mouth 25 times a second, and runs a visual speech model on the Mac's GPU, with a live preview as you go. A language model and an optional LLM pass then fix the words lip reading gets wrong. Setup takes about eight minutes: you mouth 24 practice sentences, and it fine-tunes the lip reader on your face and the language model on your own phrasing, keeping the face model only if it reads held-out sentences better than the stock one.

It's open source, with over 700 stars on GitHub, and other people have contributed Linux support and new cleanup backends.`,
        tags: ["Python", "Computer vision", "macOS"],
        links: [
          { label: "GitHub", href: "https://github.com/amywork777/lipflow" },
        ],
      },
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
        slug: "selfie-booth",
        title: "Selfie booth",
        meta: "Event photo booth",
        summary:
          "An iPad selfie booth that prints on a thermal label printer: pick a pattern, add a caption or a doodle, pose, and walk away with a print.",
        body: `An iPad selfie booth that prints on a 4x6 thermal label printer. Guests pick how many photos and a pattern, add a caption or a doodle, pose, and walk away with a print.

An iPad can't drive a USB printer, so a small Mac or Raspberry Pi sits in the middle. The iPad page does everything people see, from the camera and countdown to turning the photo into printer dots. The server only passes the finished label to the printer over USB, with no printer driver.

It's built for someone who isn't technical to run at an event: double-click Start Booth on the Mac, open one address on the iPad, and lock it to the booth.`,
        tags: ["Python", "iPad", "Thermal printing"],
        photos: ["/software/selfie-booth/booth.webp", "/software/selfie-booth/print.webp"],
        links: [
          { label: "GitHub", href: "https://github.com/amywork777/selfie-booth" },
        ],
      },
    ],
  },
];

/* The picture for each tool: a screenshot of it in use (never a GitHub
   card), shown in the homepage list. The top of its page leads with the
   most dynamic, accurate example there is (Amy's rule): a mini demo, the
   live site, or the real video, and the still only when there's nothing else. */
type Picture = {
  image: string;
  cutout?: boolean;
  lead?: string;
  /** A short demo that leads the page instead of the still, from Amy's post on X. */
  /** `sound`: Amy talks in it, so it gets controls to unmute. */
  video?: { src: string; poster: string; width: number; height: number; sound?: boolean; rate?: number };
  /** A live site of Amy's that leads the page itself, running in a frame. */
  site?: string;
};
const pictures: Record<string, Picture> = {
  "region-maps": { image: "/work/region-maps.webp", video: { src: "/software/region-maps/lead.mp4", poster: "/software/region-maps/lead.webp", width: 1280, height: 720 } },
  studio: { image: "/work/studio-cover.webp", video: { src: "/software/studio/build.mp4", poster: "/software/studio/build.webp", width: 1280, height: 720 } },
  lipflow: { image: "/home/lipflow-in-use.webp", video: { src: "/software/lipflow/demo.mp4", poster: "/software/lipflow/poster.webp", width: 720, height: 1280, sound: true } },
  "cute-ghostty": { image: "/work/cute-ghostty.webp", video: { src: "/software/cute-ghostty/demo.mp4", poster: "/software/cute-ghostty/poster.webp", width: 872, height: 720 } },
  "voice-input": { image: "/work/voice-input-cover.webp", video: { src: "/software/voice-input/demo.mp4", poster: "/software/voice-input/demo.webp", width: 1146, height: 720, sound: true } },
  "smart-dropper": { image: "/work/smart-dropper-cover.webp", video: { src: "/software/smart-dropper/launch.mp4", poster: "/software/smart-dropper/launch.webp", width: 1146, height: 720, sound: true, rate: 1.5 } },
  "sf-rats": { image: "/work/sf-rats.webp", site: "https://sfrats-map.vercel.app" },
  extract: { image: "/work/extract.webp", video: { src: "/software/extract/parts.mp4", poster: "/software/extract/parts.webp", width: 1280, height: 720 } },
  ...Object.fromEntries(["cad-steps", "selfie-booth"].map(slug => [slug, { image: `/work/${slug}.webp` }])),
};

export const softwareProjects = softwareSections.flatMap((section) =>
  section.projects.map((project) => ({ ...project, section: section.title, picture: pictures[project.slug] }))
);
