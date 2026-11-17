import thumbs from "./thumbs.json";

export type ProjectLink = { label: string; url: string };

export type Project = {
  slug: string;
  title: string;
  role: string;
  year?: string;
  /** Tile image used on the index */
  cover: string;
  /** Optional second image that cross-fades in on tile hover (a "second look", usually a lifestyle or in-context shot) */
  coverHover?: string;
  /** All images for the dedicated project page, in display order. Cover may or may not be the first item. */
  gallery: string[];
  /** Long-form description, rendered as markdown-lite (paragraphs separated by blank lines, headings as ###/##) */
  body?: string;
  /** External links shown in a small list */
  links?: ProjectLink[];
  /** Twitter/X status ID, if set, the tweet (with any embedded video) renders inline near the top of the project page */
  tweetId?: string;
  /** The real thing on video (a launch film), which leads the page instead of
      the still, the most dynamic accurate example. Replaces the tweet it came from. */
  video?: { src: string; poster: string; width: number; height: number; sound?: boolean };
  /** Path or URL to a PDF; if set, an inline PDF viewer renders below the body */
  pdfPreview?: string;
};

export const projects: Project[] = [
  {
    slug: "folding-yoga-mat",
    title: "Folding yoga mat",
    role: "Vizcom, from a creator's render to a manufactured mat",
    cover: "/portfolio/folding-yoga-mat/final-mat.webp",
    coverHover: "/portfolio/folding-yoga-mat/concept.webp",
    gallery: [
      "/portfolio/folding-yoga-mat/final-mat.webp",
      "/portfolio/folding-yoga-mat/concept.webp",
      "/portfolio/folding-yoga-mat/two-patterns.webp",
      "/portfolio/folding-yoga-mat/fold-sequence.webp",
    ],
    links: [
      { label: "The inspiration: Tara's original reel", url: "https://www.instagram.com/reels/DcBtdArysMc/" },
    ],
    body: `A full-size yoga mat that folds like origami into a square you can carry in a backpack, taken from a Vizcom render to a manufactured sample.

Tara Harcombe designed the mat in Vizcom and shared it in a reel that reached tens of thousands of people: a triangulated crease pattern that folds the whole mat flat into a small stack. At Vizcom, Jordan Taylor and I set out to make it real, as the first test of taking a creator's render all the way to a product.

I ran it as an experiment in AI-driven manufacturing. The CAD, the engineering drawings and the simulations were made by AI agents, and so were finding suppliers, reaching out to them and working with the factory, with me checking every step.

## The engineering problem

Paper folds at zero thickness. Mat panels are several millimetres thick, so every hinge needs room for the material to wrap around the fold. The first factory sample jammed for exactly that reason. The fix was wider gaps between the panels and a crease pattern that stacks cleanly when thick, the thickness accommodation problem from origami engineering.

### How it went

- The crease pattern and fold sequence are parametric CAD, with a fold check run on every change
- Two crease patterns were sampled side by side, and the one that folded flat without jamming was chosen
- The finished prototype (top) arrived at the San Francisco office, where we tested it with a push-up competition, and the feedback (smaller gaps, a grippier rubber between panels, a slightly bigger mat) went into the next round

Next is a finished-quality run in the new material and size, with packaging and a launch video from Tara.`,
  },

  // ── Row 1 ─────────────────────────────────────────────
  {
    slug: "taya-pendant",
    title: "Taya pendant",
    role: "AI wearable journal designed as jewelry",
    cover: "/portfolio/taya-pendant.png",
    coverHover: "/portfolio/taya-pendant/worn.png",
    gallery: [
      "/portfolio/taya-pendant.png",
      "/portfolio/taya-pendant/worn.png",
      "/portfolio/taya-pendant/hero.png",
    ],
    body: `Taya is a necklace that listens, then turns your conversations and thoughts into a private journal you can search and ask questions of. I co-founded the company behind it. We raised about $5M, went through a16z speedrun, and built the hardware and AI prototype in about six weeks. It launched in September 2025 as jewelry that remembers.

## The engineering problem

Something you wear every day has to look like jewelry first, and an always-listening device looks like a gadget. A pendant has room for very little: a microphone that has to hear you and not the room, a battery that has to last the day, seals against water, and a chipset that listens without draining it.

### How it went

- Jewelry first, technology second: the metal housing and chain were modeled for comfort, weight and everyday movement
- A custom microphone layout picks up your voice and cuts the background, and the housing and the way it hangs on the chain angle the microphone toward you
- The pendant filters noise and isolates your voice before anything leaves it, and encrypts the audio on its way to the phone
- The phone does the transcription and sorts it into memories, a searchable journal and a chat, with local storage and encrypted sync so your data stays yours

The work in progress was voice isolation in louder rooms, better journal organization and more efficient on-device processing.`,
    links: [
      { label: "tayanecklace.com", url: "https://tayanecklace.com/" },
      { label: "Watch demo", url: "https://www.notion.so/taya-necklace-ai-jewelry-device-2b8fc3fa1d2a80389f99e88d602b8b2c?source=copy_link#2b8fc3fa1d2a80c5837df15630b5739c" },
      { label: "Launch post", url: "https://x.com/amypretzel/status/1973055244528742531" },
    ],
    video: { src: "/portfolio/taya-pendant/launch.mp4", poster: "/portfolio/taya-pendant/launch.webp", width: 1280, height: 720, sound: true },
  },

  {
    slug: "ai-jewelry",
    title: "Taiyaki Jewelry",
    role: "AI sketch-to-jewelry pipeline",
    cover: "/portfolio/dog-charm.png",
    gallery: [
      "/portfolio/dog-charm.png",
      "/portfolio/ai-jewelry/image.webp",
      "/portfolio/ai-jewelry/image-1.png",
      "/portfolio/ai-jewelry/image-2.webp",
    ],
    body: `An AI pipeline that turns sketches, photos, and descriptions into finished metal jewelry.

Taiyaki Jewelry pairs image-conditioned 3D generation with a CAD-style geometry cleanup stage and a traditional lost-wax casting workflow. A user's drawing or memory becomes a wearable piece in sterling silver, gold vermeil, or solid 14k gold.

## Technical overview

The pipeline is engineered for *castability*, not just rendering. The output of the model has to survive being printed in resin, invested in plaster, burned out, replaced with molten metal, and finished by hand. Generative geometry that doesn't account for any of that physical reality produces a beautiful render and a broken casting.

### Geometry pipeline

- Image understanding extracts silhouette, motif, and proportion from the user's sketch or reference
- A 3D generator produces a mesh aligned to that input
- A repair stage closes non-manifold edges and self-intersections so the model is watertight
- A thickness pass enforces consistent minimum wall thickness so thin features don't burn out
- A surface-conditioning pass smooths high-frequency mesh noise so the casting takes a clean polish

### Manufacturability constraints

The cleanup stage encodes the rules that take a jewelry CAD designer years to internalize. Consistent minimum thickness for the alloy and section length. No unsupported overhangs that crack the wax pattern during burnout. Curvature limits on small features. Clean drafts on flat regions so the part demolds without flash.

### Casting workflow

- Each model is 3D-printed in castable photopolymer resin at high resolution
- The print is sprued, invested in plaster, and burned out in a kiln
- Molten metal replaces the cavity in a centrifugal or vacuum cast
- Castings are filed, tumbled, and polished by metal artisans in California

### Use cases

- Memorial pieces from a single photograph
- Custom commission work from a hand sketch
- Storytelling jewelry that wouldn't be economical to model in CAD from scratch`,
  },


  // ── Row 2 ─────────────────────────────────────────────
  {
    slug: "iphone-finewoven",
    title: "iPhone FineWoven case",
    role: "Apple",
    cover: "/portfolio/iphone-finewoven.webp",
    coverHover: "/portfolio/iphone-finewoven/keynote-wall.webp",
    gallery: ["/portfolio/iphone-finewoven.webp"],
    pdfPreview: "/portfolio/iphone-finewoven/patent.pdf",
    body: `I led materials development and mechanical integration for the iPhone FineWoven case, work I'm now credited on as a co-inventor on the patent. FineWoven was Apple's first major move away from leather in its accessory line, a shift PETA recognized with their 2023 Company of the Year award.

The technical scope sat at the intersection of textile engineering and structural mechanics. I engineered high-performance woven textiles and polymer composites for softgoods enclosures, then designed and ran the manufacturing test protocols that proved out durability and tactile response across the lifecycle of the part.

Specifics under NDA. The broader story, replacing a material that had become a quiet environmental cost with something engineered to perform as well, is the part I'm most proud of.

## Patent

**“Accessory devices with textile-based walls”**, US20250088581A1, published by the USPTO on March 13, 2025. Filed June 20, 2024, with a priority date of September 11, 2023.

From the abstract: “An accessory device includes multiple walls and textile layers covering the walls. The textile layers may be of the same materials. However, one of the textile layers may include a film that provides protection against stains and fraying.”

Listed as one of 19 named inventors on the application, alongside the rest of the Apple softgoods accessory team. The full filing is embedded below; the PDF and Google Patents page are also linked under references.`,
    links: [
      { label: "View on Google Patents", url: "https://patents.google.com/patent/US20250088581A1/en" },
      { label: "Patent PDF", url: "/portfolio/iphone-finewoven/patent.pdf" },
      { label: "Patent announcement on X", url: "https://x.com/amypretzel/status/1909033061469274568" },
      { label: "PETA, Apple wins Company of the Year", url: "https://www.peta.org/media/news-releases/apple-wins-petas-company-of-the-year-award-for-industry-shifting-leadership-on-leather-use/" },
    ],
  },

  {
    slug: "ipad-smart-folio",
    title: "iPad accessories",
    role: "Apple",
    cover: "/portfolio/ipad-smart-folio.png",
    gallery: ["/portfolio/ipad-smart-folio.png"],
    body: `I worked on softgoods engineering for iPad accessories at Apple, designing and prototyping the laminated fabric enclosures used across the accessory line. The scope ran from materials selection and composite stack qualification, through nonlinear FEA on anisotropic fabric models, to the durability protocols that validated abrasion resistance, fold fatigue, and dimensional stability across the full life of the part.

Day-to-day this meant rapid iteration on new form factors, running materials and accelerated aging tests through many cycles, and working across mechanical, materials, and manufacturing teams to drive each design through DFM. Softgoods at this scale is a stack-up problem. The face fabric, adhesive, foam core, film, and backing layers all interact through modulus, CTE, and surface chemistry; getting a part that survives years of human use means controlling every one of those interactions at once.

Specifics under NDA. The products are publicly available; the engineering is the part most people never see.`,
    links: [
      { label: "iPad accessories, Apple", url: "https://www.apple.com/shop/ipad/accessories" },
    ],
  },

  {
    slug: "pretzels-favorite-food",
    title: "Pretzels, my favorite food",
    role: "Personal project",
    cover: "/portfolio/pretzel-molds.webp",
    coverHover: "/portfolio/pretzels-favorite-food/earrings.webp",
    gallery: [
      "/portfolio/pretzel-molds.webp",
      "/portfolio/pretzels-favorite-food/1.webp",
      "/portfolio/pretzels-favorite-food/2.webp",
      "/portfolio/pretzels-favorite-food/3.webp",
      "/portfolio/pretzels-favorite-food/4.webp",
      "/portfolio/pretzels-favorite-food/5.webp",
      "/portfolio/pretzels-favorite-food/6.webp",
      "/portfolio/pretzels-favorite-food/7.webp",
      "/portfolio/pretzels-favorite-food/8.webp",
      "/portfolio/pretzels-favorite-food/9.webp",
      "/portfolio/pretzels-favorite-food/10.webp",
      "/portfolio/pretzels-favorite-food/11.webp",
      "/portfolio/pretzels-favorite-food/12.webp",
    ],
    body: `The pretzel is the namesake of this site, a personal motif I keep coming back to. The shapes here are injection-molded pretzels in a dozen colors: palm-sized, somewhere between a charm and a craft prop.

A pretzel is a satisfying object to design around. It's a topological knot drawn from a single line, simple enough to recognize at a glance and complex enough that hand-making one always feels a little like an accomplishment. The contrast between the three tight loops and the soft body is part of what makes the form so legible: there's nothing else it could be.

The collection runs through the standard injection-molding pipeline: a metal mold tool with the pretzel cavity machined in, pigmented thermoplastic shot batch after batch in different colors. Pretzels show up in my work as a recurring signature: the chosen mascot, the photo prop, the pixel icon in the corner of every page on this site.`,
  },

  // ── Row 3 ─────────────────────────────────────────────
  {
    slug: "harp-instrument",
    title: "Harp instrument",
    role: "Stanford, music and product design",
    cover: "/portfolio/harp-instrument/white-bg.webp",
    coverHover: "/portfolio/harp-instrument/in-hands.webp",
    gallery: [
      "/portfolio/harp-instrument/white-bg.webp",
      "/portfolio/harp-instrument/in-hands.webp",
      "/portfolio/harp-instrument/heart-holes.webp",
      "/portfolio/harp-instrument/1.webp",
      "/portfolio/harp-instrument/2.webp",
      "/portfolio/harp-instrument/3.webp",
      "/portfolio/harp-instrument/4.webp",
    ],
    body: `A small CNC-machined harp built for a Stanford music + product design class. Aluminum body, steel strings, tabletop scale rather than concert.

The structural challenge was tuning load. A small instrument carries a surprisingly large cumulative string tension, on the order of tens of pounds across the bridge, all of it pulling the frame inward. The frame had to resist that load without bowing past the threshold that would shift pitch perceptibly, and the tuning pegs had to develop enough static friction that a tuned string holds through a session.

Most of the engineering was structural. I sized the frame walls so deflection under full string tension stayed below the audibility threshold, and designed a tapered slot for each tuning peg so the friction increases as the string is brought up to pitch (the classic violin-peg trick, scaled down). The geometry was verified empirically: tune the instrument, walk away, come back in an hour and check.

Designing for sound is its own kind of discipline. You can't simulate timbre the way you can simulate stress; you build, you listen, you redistribute mass and string-anchor stiffness, and you build the next one. Recording linked below.`,
    links: [
      { label: "Listen", url: "/portfolio/harp-instrument/playing.mp4" },
    ],
  },

  {
    slug: "membrane-whistle",
    title: "Lil membrane whistle",
    role: "Stanford, music and product design",
    cover: "/portfolio/woodwind-mouthpiece.png",
    gallery: [
      "/portfolio/woodwind-mouthpiece.png",
      "/portfolio/membrane-whistle/1.webp",
      "/portfolio/membrane-whistle/3.webp",
      "/portfolio/membrane-whistle/4.webp",
      "/portfolio/membrane-whistle/5.webp",
      "/portfolio/membrane-whistle/6.webp",
      "/portfolio/membrane-whistle/7.webp",
    ],
    body: `A small membrane-driven whistle exploring how a tensioned vibrating film changes the timbre of a simple aerophone. Built for the same Stanford music + product design class as the harp.

A standard whistle uses a fipple: a fixed edge that splits an air stream and produces a tone at a frequency set by the resonant length of the tube. A membrane whistle replaces (or augments) the fipple with a stretched film. The airflow drives the membrane, the membrane modulates the airflow, and the result is a tone colored by the membrane's own modal frequencies.

The acoustics live in the coupling between three subsystems: the breath channel that delivers a stable laminar jet, the tube length that sets the fundamental, and the membrane whose tension determines its mode shapes. Designing the instrument was iterating on those three until the membrane mode reinforced rather than fought the tube mode. The character ends up somewhere between a kazoo and a flute: breathier than a whistle, more pitched than a kazoo.

The body is a turned aluminum tube; the membrane is a thin polymer film stretched across one end. Most of the design work was iterating on membrane tension, breath-channel geometry, and the small slots that direct airflow over the membrane edge. Recording linked below.`,
    links: [
      { label: "Listen", url: "/portfolio/membrane-whistle/playing.mp4" },
    ],
  },

  {
    slug: "lil-spider-maze",
    title: "Lil spider maze",
    role: "Stanford, CNC machining",
    cover: "/portfolio/cnc-spider-web.png",
    coverHover: "/portfolio/lil-spider-maze/in-use.webp",
    gallery: [
      "/portfolio/cnc-spider-web.png",
      "/portfolio/lil-spider-maze/in-use.webp",
      "/portfolio/lil-spider-maze/1.webp",
      "/portfolio/lil-spider-maze/3.webp",
      "/portfolio/lil-spider-maze/4.webp",
      "/portfolio/lil-spider-maze/5.webp",
      "/portfolio/lil-spider-maze/6.webp",
      "/portfolio/lil-spider-maze/7.webp",
      "/portfolio/lil-spider-maze/8.webp",
    ],
    body: `A small physical puzzle made for a Stanford CNC class. A metal base carries CNC-milled channels in a spider-web pattern; a laser-cut clear acrylic top sheet sits over it as a window; a steel ball navigates the maze beneath the cover.

The transparent top was the design choice: it lets you see through to the path you've taken, which makes the object feel less like a maze and more like a tiny instrument.

The web pattern was generated to maximize dead ends without crossing the line into frustrating. The channel geometry, depth, width, and corner radius, was tuned to trap the ball gently rather than catastrophically: deep enough to keep it on the path, shallow enough to let it slide.

The build was a study in two pipelines at once. The metal base needed careful CNC strategy: end mill selection, feed rate, and step-down tuned to keep the channel walls clean and the floor flat enough that the ball rolls predictably. The acrylic top was laser-cut for a clean perimeter and a flush fit against the base. Two processes, one finished object.`,
  },

  // ── Row 4 ─────────────────────────────────────────────
  {
    slug: "injection-molded-fabric",
    title: "Injection-molded fabric",
    role: "Stanford, injection molding",
    cover: "/portfolio/injection-molded-fabric/bag-white.webp",
    coverHover: "/portfolio/injection-molded-fabric/dress.webp",
    gallery: [
      "/portfolio/injection-molded-fabric/bag-white.webp",
      "/portfolio/injection-molded-fabric/bag.webp",
      "/portfolio/injection-molded-fabric/dress.webp",
      "/portfolio/injection-molded-fabric/editorial.webp",
      "/portfolio/injection-molded-fabric/1.webp",
      "/portfolio/injection-molded-fabric/2.webp",
      "/portfolio/injection-molded-fabric/3.webp",
      "/portfolio/injection-molded-fabric/4.webp",
      "/portfolio/injection-molded-fabric/5.webp",
      "/portfolio/injection-molded-fabric/6.webp",
      "/portfolio/injection-molded-fabric/7.webp",
      "/portfolio/injection-molded-fabric/8.webp",
    ],
    body: `Experiments in injection-molding plastic structures that look and behave like textile, made for Stanford's ME 325 Injection Molding course. The pieces shown are pure plastic, no actual fabric anywhere; the woven appearance comes entirely from the cavity geometry.

The mold is a small metal plate with multiple cavities, machined in the Stanford shop. Each cavity is carved with the geometry of a mesh, knit, or weave. Pigmented thermoplastic is shot into the tool, the plastic flows into the textile-like geometry, and what comes out is a part that drapes and reads like fabric while behaving mechanically as a polymer mesh.

The interesting outputs aren't really parts, they're material studies. They show that the perceived qualities of fabric, drape, openness, the rhythm of repeated yarn intersections, can be carried by a plastic geometry alone. As much as anything, the project was a forcing function for thinking about tooling: parting-line strategy, gate placement, runner sizing, vent geometry, and how all four of those decisions show up in the part once the press cycles.`,
  },

  {
    slug: "crocheting",
    title: "Crocheting",
    role: "Personal craft, and a class I taught at Stanford",
    cover: "/portfolio/patchwork-cardigan.webp",
    coverHover: "/portfolio/crocheting/photoshoot.webp",
    gallery: [
      "/portfolio/patchwork-cardigan.webp",
      "/portfolio/crocheting/casual.webp",
      "/portfolio/crocheting/photoshoot.webp",
      "/portfolio/crocheting/hat.webp",
      "/portfolio/crocheting/image0-1.webp",
      "/portfolio/crocheting/img-1080.webp",
      "/portfolio/crocheting/img-1075.webp",
      "/portfolio/crocheting/snapchat-157100115.webp",
      "/portfolio/crocheting/snapchat-476075781.webp",
      "/portfolio/crocheting/image-6.webp",
      "/portfolio/crocheting/image-4-min.webp",
      "/portfolio/crocheting/image-8-min.webp",
      "/portfolio/crocheting/image-7-min.webp",
      "/portfolio/crocheting/image-5-min.webp",
      "/portfolio/crocheting/image-3-min.webp",
      "/portfolio/crocheting/af1qipof2ja6kli-7xcuxn2jdktdhsu8yw3hf1hobzkw1536-h2048.webp",
      "/portfolio/crocheting/screenshot-2020-10-23-121641.webp",
    ],
    body: `Long-running personal craft and one of the things I'd do anywhere if the choice were mine. The patchwork cardigan shown is one of many; each square is an evening, a leftover skein, sometimes a project in itself before it became part of something bigger.

I taught a crochet class at Stanford, *Introduction to Crochet Construction and Textile*, in fall 2020. A short course covering basic stitches, granny squares, garment shaping, and a final project of the student's choice. Syllabus linked below.

What I like about crochet is that it's textile mechanics by hand. Every stitch is a small decision about geometry: the loop you draw through, the direction you wrap, the tension you hold. Each stitch is also one node in a chain-loop topology that gives crochet its characteristic mechanical behavior, anisotropic stretch, asymmetric drape, edges that curl unless you account for them. Those properties all derive from the stitch pattern at the millimeter scale, the same way a woven fabric's behavior derives from its weave. It's the same discipline as designing in software, just slower and warmer.`,
    links: [
      { label: "Crochet class syllabus", url: "https://drive.google.com/file/d/1SsCSWfZWcnN33-fz_uJsly00cqfyK-uU/view" },
    ],
  },

  {
    slug: "sushi-eating-accessory",
    title: "Sushi-eating accessory",
    role: "Personal project",
    cover: "/portfolio/sushi-accessory.webp",
    coverHover: "/portfolio/sushi-eating-accessory/in-use.webp",
    gallery: [
      "/portfolio/sushi-accessory.webp",
      "/portfolio/sushi-eating-accessory/material-variants.webp",
      "/portfolio/sushi-eating-accessory/image.webp",
      "/portfolio/sushi-eating-accessory/image-1.png",
      "/portfolio/sushi-eating-accessory/image-2.webp",
      "/portfolio/sushi-eating-accessory/image-3.webp",
      "/portfolio/sushi-eating-accessory/image-4.webp",
      "/portfolio/sushi-eating-accessory/image-5.webp",
      "/portfolio/sushi-eating-accessory/image-6.webp",
      "/portfolio/sushi-eating-accessory/image-7.webp",
    ],
    body: `A small accessory designed to make eating sushi a little easier and a little more delightful. The first image is a watercolor study, a way to imagine the experience of using the object before deciding what the object should be.

The form combined a few small jobs that usually need three or four separate dishes: a place to rest chopsticks, a small well for soy sauce, and a low rim that doubles as a serving plate. Designing for a familiar ritual is a particular kind of constraint, anything you add has to disappear into the meal rather than call attention to itself.

The studies explored ceramic and silicone variants. Ceramic gave the object weight and presence on the table but was unforgiving in production: a single shrinkage crack in the kiln and a piece is gone. Food-grade silicone is more forgiving in process and warmer in the hand, but it doesn't carry the same aesthetic weight. Each material set its own constraints on form (draft on undercuts for the silicone molds, wall thickness and cure schedule for the ceramic), and the studies converged on shapes that worked in both.`,
  },

  // ── Row 5 ─────────────────────────────────────────────
  {
    slug: "clarinet-tuning-barrel",
    title: "Clarinet tuning barrel",
    role: "Stanford, music and product design",
    cover: "/portfolio/clarinet-barrel.png",
    coverHover: "/portfolio/clarinet-tuning-barrel/playing.webp",
    gallery: [
      "/portfolio/clarinet-barrel.png",
      "/portfolio/clarinet-tuning-barrel/playing.webp",
      "/portfolio/clarinet-tuning-barrel/1.webp",
      "/portfolio/clarinet-tuning-barrel/2.webp",
      "/portfolio/clarinet-tuning-barrel/3.webp",
      "/portfolio/clarinet-tuning-barrel/4.webp",
      "/portfolio/clarinet-tuning-barrel/5.webp",
      "/portfolio/clarinet-tuning-barrel/6.webp",
      "/portfolio/clarinet-tuning-barrel/8.webp",
      "/portfolio/clarinet-tuning-barrel/9.webp",
      "/portfolio/clarinet-tuning-barrel/10.webp",
      "/portfolio/clarinet-tuning-barrel/11.webp",
    ],
    body: `A precision-machined telescoping barrel for a clarinet, the short section between the mouthpiece and the upper joint. Adjustable length lets the player fine-tune intonation without swapping out an entire barrel.

Built for a Stanford music + product design class. I play clarinet, and the standard correction for intonation drift (the instrument going sharp as it warms up, because sound travels faster in warm air) is either to pull the existing barrel out a few millimeters or to keep a longer second barrel in your case. A telescoping barrel collapses both options into one and lets the player make the correction continuously, on the fly.

The construction is two interlocking aluminum sleeves with a precision sliding fit and an o-ring seal to maintain the integrity of the air column. The fit tolerance is the whole game: too loose and the seal leaks past the o-ring, killing the tone; too tight and the player can't slide the barrel mid-piece without breaking embouchure. I machined the sleeves with a few microns of intentional clearance and tuned the o-ring squeeze ratio to land the friction in the right window, enough to hold position when set, light enough to slide under thumb pressure.

Designing for a musician means thinking about the millimeters that affect intonation and the feel of the instrument under the fingers at the same time.`,
  },

  {
    slug: "dough-roller",
    title: "Dough roller",
    role: "Kitchen tool study",
    cover: "/portfolio/dumpling-press.webp",
    coverHover: "/portfolio/dough-roller/dumplings.webp",
    gallery: [
      "/portfolio/dumpling-press.webp",
      "/portfolio/dough-roller/dumplings.webp",
      "/portfolio/dough-roller/1.webp",
      "/portfolio/dough-roller/2.webp",
      "/portfolio/dough-roller/3.webp",
      "/portfolio/dough-roller/4.webp",
      "/portfolio/dough-roller/5.webp",
      "/portfolio/dough-roller/6.webp",
      "/portfolio/dough-roller/7.webp",
    ],
    body: `A kitchen tool designed for making dumpling and gyoza skins. Standard rolling pins are sized for pie crust and pasta sheets; a single-skin roller is a different problem.

The brief was efficiency and feel. Each skin gets one pass: center the dough ball, roll once with rotation, you have a skin. Repeat eighty times for a family meal. The handle had to stay comfortable across that volume of repetition, the roller weighted enough that the user glides rather than presses, and the whole thing easy to wash and dry between batches.

The form is a stout hardwood roller with a soft-grip handle, mass-balanced so the cylinder's inertia does the work and the user's wrist doesn't have to. The wood is finished with a food-safe oil that sits in the grain rather than sealing the surface, so the roller stays grippy on flour-coated dough and recovers between uses. Compact enough to keep on a hook by the stove. A small object that quietly changes a familiar kitchen task.`,
  },

  {
    slug: "quarter-bending-press",
    title: "Quarter bending press",
    role: "Stanford, fixture design",
    cover: "/portfolio/arbor-press.png",
    gallery: [
      "/portfolio/arbor-press.png",
      "/portfolio/quarter-bending-press/1s.webp",
      "/portfolio/quarter-bending-press/3s.webp",
      "/portfolio/quarter-bending-press/4s.webp",
      "/portfolio/quarter-bending-press/2s.webp",
    ],
    body: `A fixture designed for cleanly bending US quarters on a benchtop arbor press. Built for a Stanford fixture-design exercise, a constrained problem with all the texture of real machine-shop work.

The challenge was force and geometry. A quarter is a cupronickel-clad copper sandwich, roughly 1.75 mm thick and 24.26 mm in diameter. Bending it cleanly requires localized force in the kilonewton range without cracking the cladding or galling the die. I worked the force budget from the yield strength and section modulus of the coin, designed a die geometry that produced a controlled fold without strain concentrations at the corners, and machined the fixture from tool steel to fit a standard one-ton arbor press.

The surprise was how much the fixture geometry mattered relative to the press itself. The bench press has more than enough tonnage; the limit was how cleanly the coin could be constrained during the bend. Get the support geometry right and the fold is repeatable across many trials. Get it slightly off and the coin cracks at the cladding interface, slips out of the die, or curls unpredictably. Full report linked below.`,
    links: [
      { label: "Full report", url: "https://drive.google.com/file/d/169505jEpmlo0zmLeijBc7gZr6NMaKsoR/view" },
    ],
  },

  // ── Row 6 (3 not visible in the screenshot) ───────────
  {
    slug: "tampon-case",
    title: "Tampon case",
    role: "Personal project",
    cover: "/portfolio/pearl-applicator.png",
    coverHover: "/portfolio/tampon-case/in-use.webp",
    gallery: [
      "/portfolio/pearl-applicator.png",
      "/portfolio/tampon-case/in-use.webp",
      "/portfolio/tampon-case/1.webp",
      "/portfolio/tampon-case/3.webp",
      "/portfolio/tampon-case/4.webp",
      "/portfolio/tampon-case/5.webp",
      "/portfolio/tampon-case/6.webp",
      "/portfolio/tampon-case/7.webp",
      "/portfolio/tampon-case/8.webp",
      "/portfolio/tampon-case/9.webp",
      "/portfolio/tampon-case/10.webp",
      "/portfolio/tampon-case/11.webp",
      "/portfolio/tampon-case/12.webp",
      "/portfolio/tampon-case/13.webp",
      "/portfolio/tampon-case/14.webp",
      "/portfolio/tampon-case/15.webp",
      "/portfolio/tampon-case/16.webp",
      "/portfolio/tampon-case/17.webp",
      "/portfolio/tampon-case/18.webp",
      "/portfolio/tampon-case/19.webp",
      "/portfolio/tampon-case/21.webp",
      "/portfolio/tampon-case/22.webp",
    ],
    body: `A reusable case for menstrual products, a small study in how an everyday personal object can feel intentional rather than disposable.

The constraints were practical and emotional. Practical: discreet in a bag, openable one-handed, washable, durable across thousands of cycles. Emotional: warm in the hand, satisfying to hold, free of the visual defensiveness that period products usually carry. The reference was a good lipstick case, an object that reads as "just nice" until you open it.

The form went through many iterations: FDM 3D prints to validate the snap-closure mechanics, and silicone overmolds for grip. The version shown is a soft-touch capsule with a two-stage snap closure, sized to the smallest standard product and engineered so the haptic of the snap is decisive rather than fiddly. The geometry of the snap, undercut depth, lip radius, beam length, was tuned through prints until the close pressure landed where I wanted it.`,
  },

  {
    slug: "raccoon-poker-chip",
    title: "Raccoon poker chip",
    role: "Stanford, injection molding",
    cover: "/portfolio/tbd-panda-soap.webp",
    coverHover: "/portfolio/raccoon-poker-chip/hero-many-colors.webp",
    gallery: [
      "/portfolio/tbd-panda-soap.webp",
      "/portfolio/raccoon-poker-chip/hero-many-colors.webp",
      "/portfolio/raccoon-poker-chip/injection-sequence.webp",
      "/portfolio/raccoon-poker-chip/1.webp",
      "/portfolio/raccoon-poker-chip/2.webp",
      "/portfolio/raccoon-poker-chip/3.webp",
      "/portfolio/raccoon-poker-chip/4.webp",
      "/portfolio/raccoon-poker-chip/5.webp",
      "/portfolio/raccoon-poker-chip/6.webp",
      "/portfolio/raccoon-poker-chip/7.webp",
      "/portfolio/raccoon-poker-chip/8.webp",
      "/portfolio/raccoon-poker-chip/9.webp",
      "/portfolio/raccoon-poker-chip/10.webp",
      "/portfolio/raccoon-poker-chip/11.webp",
      "/portfolio/raccoon-poker-chip/12.webp",
    ],
    body: `A custom-tooled poker chip with a raccoon emboss, designed and produced through the full injection-molding pipeline for Stanford's ME 325. The motif chose itself; the design exercise was the same regardless of subject.

The work was end-to-end: CAD design of the chip and the cavity, parting-line strategy, sprue and runner sizing, gate location and type, ejector pin layout, and vent geometry. The mold tool was machined in the Stanford shop: manual operations for the simple features and CNC for the raccoon emboss and the rim lettering.

Once the tool was on the press, every shot is diagnostic. Short shots tell you the gate is undersized or the cycle pressure is too low. Flash on the parting line tells you the platen force is wrong or the parting surfaces aren't flat. Sink marks at thick sections tell you the part isn't packing out evenly during the hold phase. Burn marks tell you a vent is blocked. The iteration loop is: tighten the cycle, observe the part, adjust the tool or the parameters, run again.

The chips themselves are pigmented LDPE. They stack well, they have a satisfying weight, and they bear the marks of every decision made in the tool. As an exercise, injection molding teaches that the part you ship is downstream of the geometry you carve into metal.`,
  },

  {
    slug: "grasper-analysis",
    title: "Grasper analysis",
    role: "Intuitive Surgical retractor teardown",
    cover: "/portfolio/medical-mechanism.png",
    gallery: [
      "/portfolio/medical-mechanism.png",
      "/portfolio/grasper-analysis/retractor-tear-down-2.webp",
      "/portfolio/grasper-analysis/retractor-tear-down-11.webp",
      "/portfolio/grasper-analysis/retractor-tear-down-7.webp",
    ],
    body: `A teardown and mechanical analysis of an Intuitive Surgical small grasping retractor, the kind of end-effector that lives at the tip of a robotic surgery system's arm and gently holds tissue out of the way for the surgeon.

The goal was to understand how the design works. Surgical end-effectors are constrained by an unusual combination of demands: sub-millimeter precision, articulation through a port the diameter of a pen, and repeated autoclave cycles that are mechanically and chemically harsh.

Disassembly revealed the linkage geometry, the cable-driven actuation that turns motor inputs at the proximal end into jaw motion at the distal end, and the spring system that returns the jaws to a default state if a cable goes slack. The cable routing is laid out to minimize friction over the bend radii and to redistribute load so no single tendon carries the full closing force. The pivot pins are pressed and staked so they can't migrate during sterilization cycles. The jaw faces carry a textured grip pattern matched to typical tissue stiffness, fine enough not to perforate, coarse enough not to slip.

The teardown was a study in what mature engineering looks like: nothing is over-built, but every detail is deliberate. A useful frame for thinking about my own designs, what's in this thing on purpose, and what's habit you should question. Full Medium write-up linked below.`,
    links: [
      { label: "Full Medium write-up", url: "https://medium.com/@amyzhou_99330/intuitive-surgical-small-grasping-retractor-teardown-14131aef2c20" },
    ],
  },
];

/* Professional work, shown first on the index under "Selected". Everything
   else is a study or a craft, and follows under its own heading. */
export const selectedSlugs = [
  "folding-yoga-mat",
  "taya-pendant",
  "ai-jewelry",
  "iphone-finewoven",
  "ipad-smart-folio",
];

const bySlug = new Map(projects.map((p) => [p.slug, p]));
export const selectedProjects = selectedSlugs.map((slug) => bySlug.get(slug)!);
/* Everything else, under "Earlier work": small thumbnails, the strongest pictures
   first so the folded grid's visible rows lead with them. */
const earlierSlugs = [
  "injection-molded-fabric",
  "harp-instrument",
  "raccoon-poker-chip",
  "crocheting",
  "clarinet-tuning-barrel",
  "lil-spider-maze",
  "pretzels-favorite-food",
  "membrane-whistle",
  "sushi-eating-accessory",
  "quarter-bending-press",
  "tampon-case",
  "dough-roller",
  "grasper-analysis",
];
export const studyProjects = earlierSlugs.map((slug) => bySlug.get(slug)!);
/* Index order, used for previous and next on detail pages. */
export const orderedProjects = [...selectedProjects, ...studyProjects];

/* The list picture for an object: its cover, trimmed to 4:3 by
   scripts/make-thumbs.mjs. Cut-outs are multiplied onto the media tone. */
export const thumbOf = (slug: string) => ({
  image: `/thumbs/${slug}.webp`,
  cutout: (thumbs as Record<string, { cutout: boolean }>)[slug]?.cutout ?? false,
});
