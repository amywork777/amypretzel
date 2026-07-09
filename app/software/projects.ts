export type SoftwareDemo = {
  label: string;
  src: string;
};

export type SoftwareProject = {
  title: string;
  meta: string;
  summary: string;
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
        title: "Extract",
        meta: "AI extraction",
        summary:
          "A workbench block for pulling reusable colors, materials, parts, and visual references out of product images.",
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
        title: "Smart Dropper",
        meta: "Style transfer",
        summary:
          "A canvas tool for absorbing visual style from one image and applying it to another while preserving the target object.",
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
        title: "Voice input and language",
        meta: "Prompt UX",
        summary:
          "Voice input and language handling for faster generation across Vizcom prompt surfaces.",
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
        title: "Taiyaki 3D",
        meta: "Concept-to-CAD",
        summary:
          "An AI concept-to-CAD system for hardware teams, moving from sketches and references toward editable 3D geometry.",
        tags: ["AI CAD", "3D generation", "Hardware workflows"],
        links: [
          { label: "Project page", href: "/portfolio/taiyaki-3d" },
          { label: "Launch post", href: "https://www.linkedin.com/feed/update/urn:li:activity:7291166105191034880/" },
        ],
      },
      {
        title: "Taiyaki Jewelry",
        meta: "AI jewelry pipeline",
        summary:
          "A sketch/photo-to-jewelry workflow for turning personal references into castable metal pieces.",
        tags: ["AI CAD", "Jewelry", "Manufacturing"],
        links: [
          { label: "Project page", href: "/portfolio/ai-jewelry" },
          { label: "Launch post", href: "https://www.linkedin.com/feed/update/urn:li:activity:7340491665603772416/" },
        ],
      },
      {
        title: "Tech Pack",
        meta: "AI spec generation",
        summary:
          "A tool that turns a product render, sketch, CAD file, or short prompt into a complete manufacturing tech pack with BOM, dimensions, spec sheets, and factory notes.",
        tags: ["Manufacturing", "CAD parsing", "AI documents"],
        links: [{ label: "Live app", href: "https://techpack-ten.vercel.app" }],
      },
      {
        title: "Kerf",
        meta: "CAD kernel",
        summary:
          "A Rust B-rep solid modeling kernel with half-edge topology, boolean operations, STL/OBJ/STEP export, and a full readiness test matrix.",
        tags: ["Rust", "Geometry kernel", "Booleans"],
        links: [{ label: "GitHub", href: "https://github.com/amywork777/kerf" }],
      },
      {
        title: "CAD-Steps",
        meta: "CAD dataset",
        summary:
          "A dataset of intermediate CAD construction states for training models on step-by-step geometry creation instead of final shapes only.",
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
        title: "SF Rats",
        meta: "Community map",
        summary:
          "A React, Leaflet, and Supabase app for finding and sharing free and free-ish Bay Area events on a live map.",
        tags: ["React", "Leaflet", "Supabase"],
        links: [
          { label: "Live app", href: "https://sfrats-map.vercel.app" },
          { label: "GitHub", href: "https://github.com/amywork777/SFRATS" },
        ],
      },
      {
        title: "Cute Ghostty",
        meta: "Terminal customization",
        summary:
          "A cute Ghostty distribution and config pack with pastel themes, a custom app icon, install scripts, and a downloadable macOS build.",
        tags: ["macOS", "Shell", "Design system"],
        links: [
          { label: "Website", href: "https://cute-ghostty.vercel.app" },
          { label: "GitHub", href: "https://github.com/amywork777/CuteGhostty" },
        ],
      },
      {
        title: "Screenie",
        meta: "macOS recorder",
        summary:
          "A Swift screen recorder that automatically adds click zooms, cursor tracking, speed ramps, and copies the edited recording to the clipboard.",
        tags: ["Swift", "macOS", "Video tooling"],
        links: [
          { label: "Website", href: "https://landing-two-phi-66.vercel.app" },
          { label: "GitHub", href: "https://github.com/amywork777/Screenie" },
        ],
      },
    ],
  },
];

const allSoftwareProjects = softwareSections.flatMap((section) =>
  section.projects.map((project) => ({ ...project, section: section.title }))
);

export const featuredSoftwareProjects = ["Extract", "Taiyaki 3D", "Cute Ghostty"]
  .map((title) => allSoftwareProjects.find((project) => project.title === title))
  .filter((project): project is (typeof allSoftwareProjects)[number] => Boolean(project));
