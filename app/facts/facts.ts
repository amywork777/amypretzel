import type { FigureKind } from "./figures";

type Figure = { kind: FigureKind; label: string };
type Technique = { name: string; text: string; figure: Figure };
export type Fact = {
  slug: string;
  title: string;
  subject: string;
  body: string[];
  figure?: Figure;
  toolbox?: { title: string; techniques: Technique[] };
};

/* Newest first. Each paragraph in body renders as its own <p>. */
export const facts: Fact[] = [
  {
    slug: "bias",
    title: "Fabric stretches on the diagonal",
    subject: "Fabric",
    body: [
      "Pull a woven fabric along its threads and it barely stretches. Pull it diagonally, on the bias, and it stretches a lot.",
      "The threads themselves don't stretch. But the little squares between them can lean over into diamonds, so the fabric gets longer one way and narrower the other. That's why bias-cut dresses drape and cling to the body.",
    ],
    figure: { kind: "bias", label: "A woven square turned 45 degrees. Pulled sideways, its square cells lean into diamonds: wider and shorter, with every thread the same length." },
  },
  {
    slug: "seam-allowance",
    title: "Seam allowance",
    subject: "Sewing",
    body: [
      "Every CAD model of a sewn product is wrong by about 10mm. That's seam allowance, the strip of fabric tucked inside every stitch.",
      "CAD shows the finished shape, but the factory has to cut each flat piece bigger, with that extra strip all the way round. Most designers learn this when their first prototype comes back too small.",
    ],
    figure: { kind: "seam", label: "A cut fabric piece with a dashed stitch line 10mm inside its edge. Sewn, that 10mm folds inside the seam where you can't see it." },
  },
  {
    slug: "thickness-accommodation",
    title: "Thickness accommodation",
    subject: "Origami",
    body: [
      "Thickness accommodation is the problem of making origami work with real, thick materials. Paper folds perfectly because it's basically zero thickness, but panels like foam, wood or metal have to physically wrap around each other when they fold.",
      "So a hinge needs extra room, roughly π times the thickness it wraps around, or the panels jam. And the room needed grows as folds stack, since later folds wrap around thicker piles.",
      "Engineers solve this by widening gaps, offsetting hinges, tapering panel edges or splitting hinges into two, which lets thick panels fold flat the way paper does.",
    ],
    figure: { kind: "wrap", label: "Paper folds flat around a point. Two thick panels folded flat need their outer surface to wrap a half circle, about π times the thickness t." },
    toolbox: {
      title: "The toolbox for thick folds",
      techniques: [
        {
          name: "Tapered panels",
          text: "Bevel the panel edges so they don't collide, like cutting a V into foam so it closes.",
          figure: { kind: "tapered", label: "Two panels with bevelled edges meeting in a V. Folded, the bevels close flush at a right angle." },
        },
        {
          name: "Offset hinges",
          text: "Move the hinge line to the top or bottom surface instead of the middle, which changes which way it folds easily.",
          figure: { kind: "offset", label: "A hinge on the top surface. The panel folds over onto the other with their top faces together." },
        },
        {
          name: "Double hinges",
          text: "Split one fold into two parallel hinges with a strip between, so the strip becomes the spine of a book.",
          figure: { kind: "double", label: "Two hinges with a strip between them. Folded, the strip becomes a spine and leaves room for a stack between the panels." },
        },
        {
          name: "Membrane hinges",
          text: "Panels glued to a flexible fabric layer, like most folding mats. Simple, but the fabric needs slack to wrap.",
          figure: { kind: "membrane", label: "Two panels on a fabric layer with a gap of π times the thickness. Folded, the fabric wraps a half circle round the outside." },
        },
      ],
    },
  },
];
