export type ProjectLink = { label: string; url: string };

export type Project = {
  slug: string;
  title: string;
  role: string;
  year?: string;
  /** Tile image used on the index */
  cover: string;
  /** Optional second image that cross-fades in on tile hover (showing a "second look" — usually a lifestyle / in-context shot) */
  coverHover?: string;
  /** All images for the dedicated project page, in display order. Cover may or may not be the first item. */
  gallery: string[];
  /** Long-form description, rendered as markdown-lite (paragraphs separated by blank lines, headings as ###/##) */
  body?: string;
  /** External links shown in a small list */
  links?: ProjectLink[];
  /** Twitter/X status ID, if set, the tweet (with any embedded video) renders inline near the top of the project page */
  tweetId?: string;
  /** Path or URL to a PDF; if set, an inline PDF viewer renders below the body */
  pdfPreview?: string;
};

export const projects: Project[] = [
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
    body: `**A wearable AI journal designed as jewelry.**

Taya is a necklace that captures your thoughts, conversations, and reflections, then organizes them into a private, searchable journal. It's designed to be worn daily and engineered to feel effortless and personal.

### What Taya does

- Captures and transcribes conversations with high-quality audio
- Turns moments into searchable insights
- Builds a private, personal journal that stays in your control
- Helps you recall information such as names, plans, and ideas

### Features

**Memories**, Taya remembers what matters and keeps your thoughts organized.

**Journal**, Your reflections are searchable and always accessible.

**Chat**, Ask Taya questions and revisit insights instantly.

### Design principles

- Jewelry first, technology second
- Water resistant and built for daily life
- All-day battery life
- Engineered to hear you, not the background
- Privacy-forward and personal by default

## Technical overview

Taya combines a small hardware stack with on-device processing and a mobile pipeline to capture audio clearly, organize it, and turn it into a private journal that feels natural to use.

### Hardware and audio system

- A custom microphone layout is tuned to pick up the user's voice while reducing background noise
- The housing and chain placement position the mic at an optimal angle for everyday wear
- A low-power chipset manages continuous listening and event triggers
- The battery and charging system are designed for full-day use without adding weight or bulk
- The enclosure uses water-resistant seals so the device can handle daily conditions

### On-device processing

- The device performs initial noise filtering and voice isolation before sending anything to the phone
- Wake and capture logic is optimized to reduce power draw
- Audio packets are encrypted before leaving the device to keep recordings private

### Mobile pipeline

- The phone handles transcription and segmentation so conversations become clear text entries
- Reflections, names, dates, and action items are grouped into a searchable journal
- The app uses local storage and encrypted sync so users stay in control of their data
- A lightweight retrieval system lets the user ask quick questions and surface past moments instantly

### Form and material design

- The metal housing and chain were modeled for comfort, weight distribution, and everyday movement
- Internal parts are arranged to keep the microphone ports open while protecting them from debris
- The design balances jewelry aesthetics with practical thermal and acoustic requirements

### Future direction

Taya was designed as a wearable that blends thoughtful hardware engineering with a personal software experience. Work that was actively in progress included improving voice isolation in louder environments, expanding journal organization, and exploring even more efficient on-device processing.`,
    links: [
      { label: "tayanecklace.com", url: "https://tayanecklace.com/" },
      { label: "Watch demo", url: "https://www.notion.so/taya-necklace-ai-jewelry-device-2b8fc3fa1d2a80389f99e88d602b8b2c?source=copy_link#2b8fc3fa1d2a80c5837df15630b5739c" },
      { label: "Launch post", url: "https://x.com/amypretzel/status/1973055244528742531" },
    ],
    tweetId: "1973055244528742531",
  },

  {
    slug: "ai-jewelry",
    title: "Taiyaki Jewelry",
    role: "AI sketch-to-jewelry pipeline",
    cover: "/portfolio/dog-charm.png",
    gallery: [
      "/portfolio/dog-charm.png",
      "/portfolio/ai-jewelry/image.png",
      "/portfolio/ai-jewelry/image-1.png",
      "/portfolio/ai-jewelry/image-2.png",
    ],
    body: `**An AI pipeline that turns sketches, photos, and descriptions into finished metal jewelry.**

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
    links: [
      { label: "Launch post", url: "https://www.linkedin.com/feed/update/urn:li:activity:7340491665603772416/" },
    ],
  },

  {
    slug: "taiyaki-3d",
    title: "Taiyaki 3D",
    role: "AI concept-to-CAD for hardware teams",
    cover: "/portfolio/taiyaki-fish.png",
    gallery: [
      "/portfolio/taiyaki-fish.png",
      "/portfolio/taiyaki-3d/image.png",
      "/portfolio/taiyaki-3d/image-1.png",
      "/portfolio/taiyaki-3d/image-2.png",
      "/portfolio/taiyaki-3d/d1e195f0-8458-41c2-bed4-e53e35505cfd.png",
      "/portfolio/taiyaki-3d/4afcc8fb-a060-4b38-a790-97b9fd454b66.png",
    ],
    body: `**A concept-to-CAD system for hardware teams that generates editable 3D geometry from text, sketches, and reference images.**

Taiyaki 3D collapses the gap between an idea and a CAD model. The early version turned a rough sketch or product photo into a starting mesh in seconds; the trajectory of the work was toward editable, parametric, manufacturable B-rep geometry.

### Highlights

- Generates 3D geometry from text or images
- Output integrates with standard CAD workflows (STEP / IGES export)
- Built around real manufacturing constraints, not just visual fidelity

## Technical overview

### How the early system worked

- Image-conditioned generation extracted contours, proportions, and silhouette intent from the input
- A mesh generator produced a clean watertight body matched to the user's sketch or reference
- The user could iterate quickly: shorten a feature, smooth an edge, add detail
- Output was a watertight triangle mesh ready for 3D printing or downstream cleanup in a traditional CAD tool

### Where the system was headed

The bigger problem was not generating geometry but generating *editable* geometry. Hardware teams don't want a triangle soup; they want CAD they can adjust, version, and hand to manufacturing.

- Mesh-to-CAD conversion: turning generated meshes into B-rep solids with named features (walls, holes, fillets, shells, ribs)
- Feature recognition that lets the user re-edit dimensions on a model long after generation
- Manufacturability checks built into the pipeline (uniform wall thickness, draft on injection-molded features, clearance on hole patterns for fasteners)
- Step-by-step refinement so the user keeps iterating on the same model rather than re-generating from scratch
- Clean STEP / IGES export into SolidWorks, Fusion, Onshape, and into additive slicers

The goal was to evolve the system from "rough shape generator" to "the first 30% of a hardware team's CAD work, automated."`,
    links: [
      { label: "3Printr coverage", url: "https://www.3printr.com/taiyaki-free-ai-tool-for-3d-models-2978595/" },
      { label: "Fabbaloo launch", url: "https://www.fabbaloo.com/news/taiyaki-launches-text-to-product-ai-service-bridging-3d-design-and-manufacturing" },
      { label: "Fabbaloo hands-on", url: "https://www.fabbaloo.com/news/hands-on-with-fishcad" },
      { label: "Launch post", url: "https://www.linkedin.com/feed/update/urn:li:activity:7291166105191034880/" },
    ],
  },

  // ── Row 2 ─────────────────────────────────────────────
  {
    slug: "iphone-finewoven",
    title: "iPhone FineWoven case",
    role: "Apple",
    cover: "/portfolio/iphone-finewoven.png",
    coverHover: "/portfolio/iphone-finewoven/keynote-wall.png",
    gallery: ["/portfolio/iphone-finewoven.png"],
    pdfPreview: "/portfolio/iphone-finewoven/patent.pdf",
    body: `I led materials development and mechanical integration for the iPhone FineWoven case, work I'm now credited on as a co-inventor on the patent. FineWoven was Apple's first major move away from leather in its accessory line, a shift PETA recognized with their 2023 Company of the Year award.

The technical scope sat at the intersection of textile engineering and structural mechanics. I engineered high-performance woven textiles and polymer composites for softgoods enclosures, then designed and ran the manufacturing test protocols that proved out durability and tactile response across the lifecycle of the part.

Specifics under NDA. The broader story, replacing a material that had become a quiet environmental cost with something engineered to perform as well, is the part I'm most proud of.

## Patent

**"Accessory devices with textile-based walls"** — US20250088581A1, published by the USPTO on March 13, 2025. Filed June 20, 2024, with a priority date of September 11, 2023.

From the abstract: "An accessory device includes multiple walls and textile layers covering the walls. The textile layers may be of the same materials. However, one of the textile layers may include a film that provides protection against stains and fraying."

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
    cover: "/portfolio/pretzel-molds.png",
    gallery: [
      "/portfolio/pretzel-molds.png",
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n, i) => {
        const ids = ["aed652b85a80d88f08df3237c3a2312e2981e2410bc132002b1c0cf17a7cf864", "d1b0380b6194ca4df79fcb338a7d09d5e3ea4e8c9ececedab45eac553b87fc16", "448633f8d16e4166b991a5cc025038387ee77acac58968e36970f5af76ce7ee7", "a9bb2dcb47a492fdd3832f2170ae5997350eaabd28a8a97bc46c0958a8535e9a", "4fdf71cb09914f53f4056dfaec543ed6da6240eac65609b3b0643f8a67f86d18", "435a510c65d9fac69e718be5dc6fa89bbde47fde70ac4d79d4c2cff4fca1257e", "57ade1cfccc83d451713bbf5c934fe443dd356c3ab5aef256eab895b16c68eb8", "b4d4c08e18ef77418e79155529ae646a719682a0845e4f4e3884c7401d5267c4", "f455023cc32c55c248f823337767ff35f41ebd0c6d4e3c1f54f8db1cb373b056", "796730921533c211d9ccf01b43328f636d9533cd3c148fef224a2d2b9af91930", "f4c827e2c8f04a84ae665c430a91216607c777efd4e86d6e245aa070edd27e02", "91028dfd3e036d729e2890ca9247fa3b003c8e0767109ccf0be4090123c79772"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.png`;
      }),
    ],
    body: `The pretzel is the namesake of this site, a personal motif I keep coming back to. The shapes here are injection-molded pretzels in a dozen colors: palm-sized, somewhere between a charm and a craft prop.

A pretzel is a satisfying object to design around. It's a topological knot drawn from a single line, simple enough to recognize at a glance and complex enough that hand-making one always feels a little like an accomplishment. The contrast between the three tight loops and the soft body is part of what makes the form so legible: there's nothing else it could be.

The collection runs through the standard injection-molding pipeline: a metal mold tool with the pretzel cavity machined in, pigmented thermoplastic shot batch after batch in different colors. Pretzels show up in my work as a recurring signature: the chosen mascot, the photo prop, the pixel icon in the corner of every page on this site.`,
  },

  // ── Row 3 ─────────────────────────────────────────────
  {
    slug: "harp-instrument",
    title: "Harp instrument",
    role: "Stanford, music + design",
    cover: "/portfolio/harp-instrument/white-bg.png",
    coverHover: "/portfolio/harp-instrument/in-hands.png",
    gallery: [
      "/portfolio/harp-instrument/white-bg.png",
      "/portfolio/harp-instrument/in-hands.png",
      "/portfolio/harp-instrument/heart-holes.png",
      "https://freight.cargo.site/w/1500/q/75/i/5f316e3f1e9b700b78da49b45db204f30925010443616c3b327ba6e81214b2c1/1.png",
      "https://freight.cargo.site/w/1500/q/75/i/378ab89aba231e5c712248c7e47fcd07c854907d0c4f560dc8c5bdf9a4fde97b/2.png",
      "https://freight.cargo.site/w/1500/q/75/i/c5a69dd77edf8a1d345da17666dc3c29a9dcd6b3a635f107bd77c5c209e42be7/3.png",
      "https://freight.cargo.site/w/1500/q/75/i/bdf9931c8b8f6db6272ff1e559b9c169a7a8b4ac2e8aa60168cfd5e6e496e0fd/4.png",
    ],
    body: `A small CNC-machined harp built for a Stanford music + product design class. Aluminum body, steel strings, tabletop scale rather than concert.

The structural challenge was tuning load. A small instrument carries a surprisingly large cumulative string tension, on the order of tens of pounds across the bridge, all of it pulling the frame inward. The frame had to resist that load without bowing past the threshold that would shift pitch perceptibly, and the tuning pegs had to develop enough static friction that a tuned string holds through a session.

Most of the engineering was structural. I sized the frame walls so deflection under full string tension stayed below the audibility threshold, and designed a tapered slot for each tuning peg so the friction increases as the string is brought up to pitch (the classic violin-peg trick, scaled down). The geometry was verified empirically: tune the instrument, walk away, come back in an hour and check.

Designing for sound is its own kind of discipline. You can't simulate timbre the way you can simulate stress; you build, you listen, you redistribute mass and string-anchor stiffness, and you build the next one. Recording linked below.`,
    links: [
      { label: "Listen", url: "https://drive.google.com/file/d/1Pk-t70xBEB0dF-G3Ecy7gSXF8dOjhMaG/view" },
    ],
  },

  {
    slug: "membrane-whistle",
    title: "Lil membrane whistle",
    role: "Stanford, music + design",
    cover: "/portfolio/woodwind-mouthpiece.png",
    gallery: [
      "/portfolio/woodwind-mouthpiece.png",
      "https://freight.cargo.site/w/1500/q/75/i/f69f379a0f388cb4b403f89025ef493406e2e05a03bb381f2cdecb9d4e48ef6b/1.png",
      "https://freight.cargo.site/w/1500/q/75/i/20d279adede103397eea65878d3d5b05670468f66c687452217bae48afbf520b/3.png",
      "https://freight.cargo.site/w/1500/q/75/i/adc8cc9e18aefbd2935063f7dc4dd26317668621146f053f60623761905521d4/4.png",
      "https://freight.cargo.site/w/1500/q/75/i/7f3040becb1acfd2a1c4c83aca898385952f3696962a90719b32c2634f3f08f7/5.png",
      "https://freight.cargo.site/w/1500/q/75/i/23a696a2dd87176aee3fe30899efe53d9395a563976bc5077c00979d3a7624de/6.png",
      "https://freight.cargo.site/w/1500/q/75/i/664cca511cdc8047f2a73b03cfab3570fa4ab3bf972830ef6f62774cb5bd4888/7.png",
    ],
    body: `A small membrane-driven whistle exploring how a tensioned vibrating film changes the timbre of a simple aerophone. Built for the same Stanford music + product design class as the harp.

A standard whistle uses a fipple: a fixed edge that splits an air stream and produces a tone at a frequency set by the resonant length of the tube. A membrane whistle replaces (or augments) the fipple with a stretched film. The airflow drives the membrane, the membrane modulates the airflow, and the result is a tone colored by the membrane's own modal frequencies.

The acoustics live in the coupling between three subsystems: the breath channel that delivers a stable laminar jet, the tube length that sets the fundamental, and the membrane whose tension determines its mode shapes. Designing the instrument was iterating on those three until the membrane mode reinforced rather than fought the tube mode. The character ends up somewhere between a kazoo and a flute: breathier than a whistle, more pitched than a kazoo.

The body is a turned aluminum tube; the membrane is a thin polymer film stretched across one end. Most of the design work was iterating on membrane tension, breath-channel geometry, and the small slots that direct airflow over the membrane edge. Recording linked below.`,
    links: [
      { label: "Listen", url: "https://drive.google.com/file/d/1tKC5K0He7XORUA2binunJYOy3iCnOWDI/view" },
    ],
  },

  {
    slug: "lil-spider-maze",
    title: "Lil spider maze",
    role: "Stanford, CNC art project",
    cover: "/portfolio/cnc-spider-web.png",
    coverHover: "/portfolio/lil-spider-maze/in-use.png",
    gallery: [
      "/portfolio/cnc-spider-web.png",
      "/portfolio/lil-spider-maze/in-use.png",
      "https://freight.cargo.site/w/1500/q/75/i/73a3b5a10869285fd3c4bfaf056fd02f57e0ee0a3f143b3cc0727fa9ec4bad60/1.png",
      "https://freight.cargo.site/w/1500/q/75/i/01344e4367bc898402068538e34f9c91dd4a721d8d6c03680b1355b02824deef/3.png",
      "https://freight.cargo.site/w/1500/q/75/i/03057e1a72def3a1bc32e782aafc16e8db1e35ff7d29e4061ab5578099cf5841/4.png",
      "https://freight.cargo.site/w/1500/q/75/i/883d943a980a6324dfd993f22a054355cd5b0a14a734715be1a160ac7694d536/5.png",
      "https://freight.cargo.site/w/1500/q/75/i/ccc3d6d995c9b7fe6c76d895a558fa76462ae2e24f39167bb68ac90328815fa1/6.png",
      "https://freight.cargo.site/w/1500/q/75/i/9b5f2144522cf8f3bd0a846ae127c9b016483750599e558e5b59320662832d0f/7.png",
      "https://freight.cargo.site/w/1920/q/94/i/160a9501ed65260441702b42e39d24b5abd6bfe1fe8abbe725d597ccb5cfb76e/8.png",
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
    role: "Stanford, ME 325 Injection Molding",
    cover: "/portfolio/injection-molded-fabric/bag-white.png",
    coverHover: "/portfolio/injection-molded-fabric/dress.png",
    gallery: [
      "/portfolio/injection-molded-fabric/bag-white.png",
      "/portfolio/injection-molded-fabric/bag.png",
      "/portfolio/injection-molded-fabric/dress.png",
      "/portfolio/injection-molded-fabric/editorial.png",
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => {
        const ids = ["bbc2d7e7c8bbb009533c63c9b00de7ac1aeca430657b7ad9335cc2a68a0ce9c1", "c6cb8a27922c47341752cd4629429467ca263ca66b59924e2e9158c2623cb55f", "331f52e7b5e03d904ad3ce029a8b2ff9ff564d2e79ef6513a84de66849ba6fe7", "209d4d93e62430b2d68a6bc50be1ab1f97a3c894e833658ae46b657fabd10c3e", "94c4c345afc11450270b8b01368624149082b326f07c4013c0baa915c25b20a2", "ba92abe2376a09a380a7c641bf635e3b667a5c1f0a1f055c1071ded32cd94e57", "d803a043cf1fd22eb0e5ed624bca58a6f832b70606597311a57d63c8214902a7", "3722104a91ae8018fbcabb32abe9317a59da8e916b9c77fe6800b1a0ecb56982"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
    ],
    body: `Experiments in injection-molding plastic structures that look and behave like textile, made for Stanford's ME 325 Injection Molding course. The pieces shown are pure plastic, no actual fabric anywhere; the woven appearance comes entirely from the cavity geometry.

The mold is a small metal plate with multiple cavities, machined in the Stanford shop. Each cavity is carved with the geometry of a mesh, knit, or weave. Pigmented thermoplastic is shot into the tool, the plastic flows into the textile-like geometry, and what comes out is a part that drapes and reads like fabric while behaving mechanically as a polymer mesh.

The interesting outputs aren't really parts, they're material studies. They show that the perceived qualities of fabric, drape, openness, the rhythm of repeated yarn intersections, can be carried by a plastic geometry alone. As much as anything, the project was a forcing function for thinking about tooling: parting-line strategy, gate placement, runner sizing, vent geometry, and how all four of those decisions show up in the part once the press cycles.`,
  },

  {
    slug: "crocheting",
    title: "Crocheting",
    role: "Personal craft + class instructor",
    cover: "/portfolio/patchwork-cardigan.png",
    coverHover: "/portfolio/crocheting/photoshoot.png",
    gallery: [
      "/portfolio/patchwork-cardigan.png",
      "/portfolio/crocheting/casual.png",
      "/portfolio/crocheting/photoshoot.png",
      "/portfolio/crocheting/hat.png",
      "https://freight.cargo.site/w/900/q/94/i/4dd4f35271cfb627d5c1e2e110fd68297441a354f12ef0004f85c90922262591/image0-1.png",
      "https://freight.cargo.site/w/900/q/75/i/cec38d88db9d9cef0d50df34ecc406d69a720a980fa747ce0725cb5f16f1745a/IMG_1080.jpg",
      "https://freight.cargo.site/w/900/q/75/i/5fcaa14c224bd506079a9dc3ff463272297c3703922c09480683df2b20c1a88b/IMG_1075.jpg",
      "https://freight.cargo.site/w/400/q/75/i/61a0b971a70ef192e5b6967743baf9c7ffe5eb49ae357bd342a6cffe581804aa/Snapchat-157100115.jpg",
      "https://freight.cargo.site/w/400/q/75/i/b8a992caba1c7bf64bf2faebc89ad8f1c5e977572ec0ce0a3b001e93c0d84c3b/Snapchat-476075781.jpg",
      "https://freight.cargo.site/w/800/q/75/i/8d2561b5147bbdbdfd8b1c38b4522a773ec73160b2e04ebdcfa9d50e2926e472/image-6.png",
      "https://freight.cargo.site/w/800/q/75/i/453621a04773c64b3dc3b84d36cdb79a6e824da5d49b73d668ede6c06ccc8ff9/image-4-min.png",
      "https://freight.cargo.site/w/800/q/75/i/e60f36cddc6cd4c03ef1495a513c8feaae92d2db651c901a43cb5070a146e338/image-8-min.png",
      "https://freight.cargo.site/w/800/q/75/i/c28bb5442c0d673d2e488660fd5c269785c24aceebbf44731b4844921453e82d/image-7-min.png",
      "https://freight.cargo.site/w/800/q/75/i/a95e1a384ca03f656e14cf9632be31ec437954850f599f497e7aa26d1c98c80b/image-5-min.png",
      "https://freight.cargo.site/w/800/q/75/i/e686101f7b58f553a1c2cd6b8d646c24ee4e5e9f0cae1bd7cb2b45dd561175e6/image-3-min.png",
      "https://freight.cargo.site/w/500/q/75/i/fe019ded734bedcbe249f7605605860b865d0d7b74da4ccd1308ebf1f1b5b978/AF1QipOF2jA6klI-7xCuXn2JDkTDHSu8Yw3HF1hobZkw1536-h2048.jpg",
      "https://freight.cargo.site/w/1920/q/94/i/1d47478a66fdb6d512b31fb49071009efd837e9f3362af03a9e18c6f535e6760/Screenshot-2020-10-23-121641.png",
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
    cover: "/portfolio/sushi-accessory.png",
    coverHover: "/portfolio/sushi-eating-accessory/in-use.png",
    gallery: [
      "/portfolio/sushi-accessory.png",
      "/portfolio/sushi-eating-accessory/material-variants.png",
      "/portfolio/sushi-eating-accessory/image.png",
      "/portfolio/sushi-eating-accessory/image-1.png",
      "/portfolio/sushi-eating-accessory/image-2.png",
      "/portfolio/sushi-eating-accessory/image-3.png",
      "/portfolio/sushi-eating-accessory/image-4.png",
      "/portfolio/sushi-eating-accessory/image-5.png",
      "/portfolio/sushi-eating-accessory/image-6.png",
      "/portfolio/sushi-eating-accessory/image-7.png",
    ],
    body: `A small accessory designed to make eating sushi a little easier and a little more delightful. The first image is a watercolor study, a way to imagine the experience of using the object before deciding what the object should be.

The form combined a few small jobs that usually need three or four separate dishes: a place to rest chopsticks, a small well for soy sauce, and a low rim that doubles as a serving plate. Designing for a familiar ritual is a particular kind of constraint, anything you add has to disappear into the meal rather than call attention to itself.

The studies explored ceramic and silicone variants. Ceramic gave the object weight and presence on the table but was unforgiving in production: a single shrinkage crack in the kiln and a piece is gone. Food-grade silicone is more forgiving in process and warmer in the hand, but it doesn't carry the same aesthetic weight. Each material set its own constraints on form (draft on undercuts for the silicone molds, wall thickness and cure schedule for the ceramic), and the studies converged on shapes that worked in both.`,
  },

  // ── Row 5 ─────────────────────────────────────────────
  {
    slug: "clarinet-tuning-barrel",
    title: "Clarinet tuning barrel",
    role: "Stanford, music + design",
    cover: "/portfolio/clarinet-barrel.png",
    coverHover: "/portfolio/clarinet-tuning-barrel/playing.png",
    gallery: [
      "/portfolio/clarinet-barrel.png",
      "/portfolio/clarinet-tuning-barrel/playing.png",
      ...[1, 2, 3, 4, 5, 6, 8, 9, 10, 11].map((n, i) => {
        const ids = ["7b6b6aa241421defcc385f8ef2503cee16679d8f66cf1cab46f5b94cf0a99fdd", "4875ff1015f289fd7d3e86256d9df3b24be804a67ada4da7962a7e98a7d086ca", "584426c84e46487ce0e4e6e1e9730f259ecfa07291ad97ee3eacbc2310329a05", "ec60be28d82f8edb1ad126fdb7c431a895c978e2f57892accfe7ae7a41fedd59", "886f7b56e699d04283760b3a39c7aeb4416840bd0ad5d582523f1ce0da666f8f", "d44c9ddb3ed6832f4335141f6cb18484d11d60a0ab71b8f14bc62548a34d3c9f", "05f0ba3ee6d3bdb8971c24f0d3bb068f24d18141de6de09baa0425c12f2da9e8", "69d5045ab8c92c539fda3352a8432b41aaaac904916f38c5e72153121a6087a8", "d5abec0d65713976ba041be43dad1a2a169838e34f6d70c6b6fdb7417a3cfe4c", "3989e6a9e07478842eccb055a992f0d156d36ec53ec54a0d117f9969f76d1b7f"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
    ],
    body: `A precision-machined telescoping barrel for a clarinet, the short section between the mouthpiece and the upper joint. Adjustable length lets the player fine-tune intonation without swapping out an entire barrel.

Built for a Stanford music + product design class. I play clarinet, and the standard correction for intonation drift (the instrument going flat as the body warms and the air column lengthens) is either to pull the existing barrel out a few millimeters or to keep a longer second barrel in your case. A telescoping barrel collapses both options into one and lets the player make the correction continuously, on the fly.

The construction is two interlocking aluminum sleeves with a precision sliding fit and an o-ring seal to maintain the integrity of the air column. The fit tolerance is the whole game: too loose and the seal leaks past the o-ring, killing the tone; too tight and the player can't slide the barrel mid-piece without breaking embouchure. I machined the sleeves with a few microns of intentional clearance and tuned the o-ring squeeze ratio to land the friction in the right window, enough to hold position when set, light enough to slide under thumb pressure.

Designing for a musician means thinking about the millimeters that affect intonation and the feel of the instrument under the fingers at the same time.`,
  },

  {
    slug: "dough-roller",
    title: "Dough roller",
    role: "Kitchen tool study",
    cover: "/portfolio/dumpling-press.png",
    coverHover: "/portfolio/dough-roller/dumplings.png",
    gallery: [
      "/portfolio/dumpling-press.png",
      "/portfolio/dough-roller/dumplings.png",
      ...[1, 2, 3, 4, 5, 6].map((n, i) => {
        const ids = ["ee0c338cbbbf1f2d8f47d2a57698c9a0fb109832aad3d0444175e8752967804e", "333652cacf01770950ee855b2d0324d54b57e0897c5e206de04e102efeac6021", "63a65b873cfb99a101abbd231d8c8b3ca7241c9263e4940e46ef44d56f0d947e", "2e3eb93f0bcd7ca14f848fb74f08fa8fe68d30b620d4f621ecd967da277988f5", "f57cae728e99845bfb03901fbb3175e2545aa2f5da9b9449826ac65d70b2868a", "86cbb0839a699b11be24b101def4fcb03f61859080f744dbdeec6481bcc9a75f"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.png`;
      }),
      "https://freight.cargo.site/w/1920/q/94/i/605e5b3876096abb69900e778aceaaa537b3d3d075ed47085b5ba85582f6f057/7.png",
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
      "https://freight.cargo.site/w/733/q/94/i/6efb3f677cea588b266f8c41fd6e6ffb6903bae11bad005bf1c804a0f2cc9081/1s.png",
      "https://freight.cargo.site/w/733/q/94/i/e391ac5ac08a4b764d8dbf67180490cc2a493b37ea78b6769364cb280b73249c/3s.png",
      "https://freight.cargo.site/w/733/q/94/i/c662ee439558eeb46b6e927de7d38a2da06105fb42e8f8330d5058d81fe8cd9b/4s.png",
      "https://freight.cargo.site/w/733/q/94/i/0670d6afecfa47bbbca86c20a26bc0d35547b3615cf87b952779021cd452f07f/2s.png",
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
    coverHover: "/portfolio/tampon-case/in-use.png",
    gallery: [
      "/portfolio/pearl-applicator.png",
      "/portfolio/tampon-case/in-use.png",
      ...[1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22].map((n) => {
        const ids = ["1a07f8182821b3622d40d01042331acfb4a89002e6e99d988701e118379ebdba", "e0057b94f3b051cf5482b18067e33adb7a2f3242a94df7c3ff12639789606246", "259160f7d050247b677776e54909868d2bdaaa8968456a769cea819f20ff5ae8", "ca2577bec0f6f89485e6973a6bc859abfca5af99408e8cd51079425a525a3b21", "75cabc4696d174f8838eb419f2f0e201d26555ba1a01d5b8b009f0130b215f58", "1f1f379e78c93928bc7efb1e3cae51d1ea4def609fe2092f88c635360ddb06c8", "1be3bebde9762f1bfe4ab5a8cfb8ad861f40376fd39394774993ba67c6445520", "23f4aae7caca3969f2561451c3910cb206826f72cf1b56e87164d4308000100e", "82f6a8ea147a4b530662ca3be55df73993802f00473c09e54c30ad18d5552dd2", "9b68bace6ba69ecdf44ab0227e8bdc92dcb3c5e8b41114276a4dcb20f9ff29cd", "84404c5ec9c8ccd49023a080c14af57f936cc0dcc84706e3dacda09dca7d9931", "867f5e40a45ae5a72c61a300aa45582f7dc4f931b5d96c24b4d607ee76ab4fba", "6de2f6e54b67da062fcd863412d7bb185a7ba7db3b82eeaa6e176b9b45b77308", "bdeb049993eeb6c29779a819b2cf62d093c516ae437fdaa2f0243c6c60cfed1f", "412f0de2feb5762e7fb93c667e7e88437b5534b6d0458786a82a5350197c491b", "eaf7d043e29a51cd0fc2024a244abd971d76d83a80dd4571d02b0d7def46854c", "11a3a166b404ed6207c661757065c4fda311126a87319aa03d04dea75579a92b", "59e1c5ead5af9a287e1ce0291c9dad057405530c353f7971c63f358f25d7af2d", "c4e1e80f51599a954c1a7dc80a3bbc20ff05e381ba9919be498a7541b812f3e2", "b6bf5b80bf3fe30515a638a53c81caa17b33d2bed331d227f68cdf2949064aca"];
        const i = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22].indexOf(n);
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
    ],
    body: `A reusable case for menstrual products, a small study in how an everyday personal object can feel intentional rather than disposable.

The constraints were practical and emotional. Practical: discreet in a bag, openable one-handed, washable, durable across thousands of cycles. Emotional: warm in the hand, satisfying to hold, free of the visual defensiveness that period products usually carry. The reference was a good lipstick case, an object that reads as "just nice" until you open it.

The form went through many iterations: FDM 3D prints to validate the snap-closure mechanics, and silicone overmolds for grip. The version shown is a soft-touch capsule with a two-stage snap closure, sized to the smallest standard product and engineered so the haptic of the snap is decisive rather than fiddly. The geometry of the snap, undercut depth, lip radius, beam length, was tuned through prints until the close pressure landed where I wanted it.`,
  },

  {
    slug: "raccoon-poker-chip",
    title: "Raccoon poker chip",
    role: "Stanford, ME 325 Injection Molding",
    cover: "/portfolio/tbd-panda-soap.png",
    coverHover: "/portfolio/raccoon-poker-chip/hero-many-colors.png",
    gallery: [
      "/portfolio/tbd-panda-soap.png",
      "/portfolio/raccoon-poker-chip/hero-many-colors.png",
      "/portfolio/raccoon-poker-chip/injection-sequence.png",
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n, i) => {
        const ids = ["42d9ef15076f62fab0abee3ee39819bf9d8bff9f697eb0ca533ad18559e22700", "3ec0e0a4adfe4b880ccec020c0edee1f99a7a33bb05943192da6964d5ea76d22", "d2e85ab8bd3ab98866787a2d016ca962ac8bc5f2230826b636b47f53d73a3ab1", "7defddb77c927a28b3ca5f4d8dd9fd9c37a871a5ede54496cb6b6f63e9dda139", "97bd01bbbfb5a12649185b9729cdd00b020184b435d8be8575a2911c332f0562", "d0f6d84e8a91ffeb248e0bf1859b05621ddf36c2491f940cdef7d3c22a141b75", "153d556c89ffeceafda7f223ea4758408ceaf7f62a6d0c9fe918fdbf2b163eb7", "567e91be77e07fbf3ec5b95c8e2600729c5b743c249c34475ee3cc7d6e55ba0e", "d17933e07abae064339eb04e8b63758367602a7424b7866fea572a76fee69e28", "6e90155278aa4a3765beca0dec98f90b047f5ed046fdae7f297001e26adbfb1e", "b503e5500fa7c67feacc258133b69b82f7890aa5ca647586e0e895e51bca71ef", "d1d7c4ed0c8186914b263e4f94686389cb65291d8e1ff199b7fde09aa2420afa"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
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
      "https://freight.cargo.site/w/1500/q/75/i/aed4f4ff1596c600a9395e0ccb8ab5a28328ee454c2f299c98c1397b0a712e7c/Retractor-Tear-down--2.jpg",
      "https://freight.cargo.site/w/1500/q/75/i/5e7e227267ea3a599a1be3f299df5e8fc94782798d36072c69a1eadf7e84c867/Retractor-Tear-down--11.jpg",
      "https://freight.cargo.site/w/1500/q/75/i/021c76780b2d60f3a4e57c8651b1437ecb2fd328850786a645a1da838ba588b8/Retractor-Tear-down--7.jpg",
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
