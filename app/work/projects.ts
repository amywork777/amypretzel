import { projects as objectProjects } from "../portfolio/projects";
import { softwareSections } from "../software/projects";

export type WorkLink = {
  label: string;
  href: string;
};

export type WorkProject = {
  title: string;
  context: string;
  type: "Software" | "Object" | "Hybrid" | "Article";
  summary: string;
  image?: string;
  href?: string;
  links?: WorkLink[];
  tags: string[];
};

export type WorkChapter = {
  id: string;
  title: string;
  kicker: string;
  summary: string;
  projects: WorkProject[];
};

const softwareProjects = softwareSections.flatMap((section) =>
  section.projects.map((project) => ({ ...project, section: section.title }))
);

function cleanSummary(body?: string) {
  if (!body) return "";

  const firstBlock =
    body
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !block.startsWith("#") && !block.startsWith("- ")) ?? "";

  return firstBlock
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function objectEntry(
  slug: string,
  type: WorkProject["type"],
  tags: string[],
  summaryOverride?: string
): WorkProject {
  const project = objectProjects.find((item) => item.slug === slug);
  if (!project) {
    throw new Error(`Missing object project: ${slug}`);
  }

  return {
    title: project.title,
    context: project.role,
    type,
    summary: summaryOverride ?? cleanSummary(project.body),
    image: project.cover,
    href: `/portfolio/${project.slug}`,
    links: project.links?.map((link) => ({ label: link.label, href: link.url })),
    tags,
  };
}

function softwareEntry(
  title: string,
  type: WorkProject["type"],
  tags: string[],
  image?: string
): WorkProject {
  const project = softwareProjects.find((item) => item.title === title);
  if (!project) {
    throw new Error(`Missing software project: ${title}`);
  }

  return {
    title: project.title,
    context: `${project.section}, ${project.meta}`,
    type,
    summary: project.summary,
    image,
    href: project.links?.find((link) => link.href.startsWith("/"))?.href ?? "/software",
    links: project.links,
    tags: project.tags ?? tags,
  };
}

export const workChapters: WorkChapter[] = [
  {
    id: "digital",
    title: "Digital",
    kicker: "Chapter 01",
    summary:
      "Software, AI systems, CAD tools, datasets, and digital workflows for making things.",
    projects: [
      softwareEntry("Extract", "Software", ["Vizcom", "AI workflow", "Industrial design"]),
      softwareEntry("Smart Dropper", "Software", ["Vizcom", "Style transfer", "Canvas UX"]),
      softwareEntry("Voice input and language", "Software", ["Vizcom", "Prompt UX", "Voice"]),
      softwareEntry("Taiyaki 3D", "Hybrid", ["AI CAD", "3D generation", "Hardware"], "/portfolio/taiyaki-fish.png"),
      softwareEntry("Taiyaki Jewelry", "Hybrid", ["AI CAD", "Jewelry", "Casting"], "/portfolio/dog-charm.png"),
      softwareEntry("Tech Pack", "Software", ["Manufacturing", "CAD parsing", "Spec generation"]),
      softwareEntry("Kerf", "Software", ["Rust", "Geometry kernel", "Booleans"]),
      softwareEntry("CAD-Steps", "Software", ["Dataset", "OpenCascade", "CAD learning"]),
      softwareEntry("Screenie", "Software", ["Swift", "Screen recording", "Video"]),
    ],
  },
  {
    id: "physical",
    title: "Physical",
    kicker: "Chapter 02",
    summary:
      "Hardware, jewelry, softgoods, instruments, mechanisms, and manufactured objects.",
    projects: [
      objectEntry("taya-pendant", "Hybrid", ["AI wearable", "Jewelry", "Audio"]),
      objectEntry("iphone-finewoven", "Object", ["Apple", "Softgoods", "Patent"]),
      objectEntry("ipad-smart-folio", "Object", ["Apple", "Softgoods", "Accessories"]),
      objectEntry("injection-molded-fabric", "Object", ["Injection molding", "Textile structure", "Material study"]),
      objectEntry("harp-instrument", "Object", ["CNC", "Music", "Structure"]),
      objectEntry("membrane-whistle", "Object", ["Acoustics", "Instrument", "Membrane"]),
      objectEntry("clarinet-tuning-barrel", "Object", ["Machining", "Music", "Tolerance"]),
      objectEntry("quarter-bending-press", "Object", ["Fixture", "Machining", "Force"]),
      objectEntry("grasper-analysis", "Object", ["Medical device", "Teardown", "Mechanism"]),
      objectEntry("tampon-case", "Object", ["Personal object", "Soft-touch", "Snap fit"]),
      objectEntry("raccoon-poker-chip", "Object", ["Injection molding", "Tooling", "LDPE"]),
    ],
  },
  {
    id: "hobbies",
    title: "Hobbies",
    kicker: "Chapter 03",
    summary:
      "Community maps, terminal cuteness, crochet, food objects, and personal motifs.",
    projects: [
      softwareEntry("SF Rats", "Software", ["Community map", "React", "Supabase"]),
      softwareEntry("Cute Ghostty", "Software", ["macOS", "Terminal", "Themes"]),
      objectEntry("crocheting", "Object", ["Textiles", "Craft", "Teaching"]),
      objectEntry("pretzels-favorite-food", "Object", ["Injection molding", "Motif", "Personal"]),
      objectEntry("lil-spider-maze", "Object", ["CNC", "Puzzle", "Acrylic"]),
      objectEntry("sushi-eating-accessory", "Object", ["Tableware", "Ceramic", "Silicone"]),
      objectEntry("dough-roller", "Object", ["Kitchen tool", "Wood", "Ergonomics"]),
    ],
  },
  {
    id: "articles",
    title: "Articles",
    kicker: "Chapter 04",
    summary:
      "Longer notes and engineering writeups live on X, separate from the project catalog.",
    projects: [
      {
        title: "Articles on X",
        context: "Writing, engineering notes, build logs",
        type: "Article",
        summary:
          "A running archive of writing about design, engineering, AI hardware, CAD, materials, and things I am building.",
        image: "/og-image.png",
        href: "https://x.com/amypretzel/articles",
        links: [
          { label: "Read articles", href: "https://x.com/amypretzel/articles" },
          { label: "Source", href: "https://github.com/amywork777/articles" },
        ],
        tags: ["Writing", "Engineering", "Build notes"],
      },
    ],
  },
];
