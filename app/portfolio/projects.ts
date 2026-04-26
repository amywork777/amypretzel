export type ProjectLink = { label: string; url: string };

export type Project = {
  slug: string;
  title: string;
  role: string;
  year?: string;
  /** Tile image used on the index */
  cover: string;
  /** All images for the dedicated project page, in display order. Cover may or may not be the first item. */
  gallery: string[];
  /** Long-form description, rendered as markdown-lite (paragraphs separated by blank lines, headings as ###/##) */
  body?: string;
  /** External links shown in a small list */
  links?: ProjectLink[];
  /** Twitter/X status ID, if set, the tweet (with any embedded video) renders inline near the top of the project page */
  tweetId?: string;
};

export const projects: Project[] = [
  // ── Row 1 ─────────────────────────────────────────────
  {
    slug: "taya-pendant",
    title: "Taya pendant",
    role: "AI wearable journal designed as jewelry",
    cover: "/portfolio/taya-pendant.png",
    gallery: [
      "/portfolio/taya-pendant.png",
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
    body: `**AI-assisted custom jewelry design.**

Taiyaki Jewelry transforms sketches, photos, or ideas into unique jewelry pieces. Using an AI modeling pipeline, each submission becomes a refined CAD model and is produced in sterling silver, gold vermeil, or solid 14k gold.

## Technical overview

Taiyaki Jewelry uses a custom modeling pipeline that turns sketches, photos, or ideas into finished metal pieces. The system combines image understanding with shape generation so every design starts from the user's input and becomes a 3D model that can be refined and manufactured.

### How the design pipeline works

- Analyzes the user's sketch or reference image to understand the main shapes, motifs, and proportions
- Generates an initial 3D form that reflects the style and structure of the input
- Cleans and simplifies the geometry so it can be manufactured as a metal piece
- Adds thickness, smooth surfaces, and structural support for durability
- Produces a final CAD model prepared for lost-wax casting

### Geometry processing

- Interprets curves, silhouettes, and patterns from drawings and photos
- Converts them into solid geometry with clean edges and consistent thickness
- Adjusts surfaces so they will cast cleanly and polish well
- Supports both organic shapes and precise, symmetrical designs

### Production workflow

- Each model is 3D-printed in a castable resin at high resolution
- The printed piece becomes the wax pattern used for lost-wax casting
- The pattern is placed into investment, burned out, and replaced with molten metal
- Castings are cleaned, filed, and polished by metal artisans in California
- Pieces are finished in sterling silver, gold vermeil, or solid 14k gold

### Highlights

- Converts user memories and ideas into jewelry
- AI-guided geometry generation
- Final pieces produced in California
- Ideal for gifts, memorials, and storytelling`,
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
    body: `**AI-powered concept-to-CAD system for hardware teams.**

Taiyaki 3D Tool generates editable 3D models from natural language, sketches, screenshots, and reference images. It accelerates early product exploration by turning rough ideas into parametric CAD geometry that can be refined and manufactured.

### Highlights

- Generates solid, editable CAD from text or images
- Integrates with standard CAD workflows
- Supports fast design iteration
- Built with manufacturing constraints in mind

## Technical overview

Taiyaki started as a tool that could take in sketches, screenshots, or product photos and turn them into a simple 3D shape that users could iterate on quickly. It combined light image analysis with mesh generation so it could understand the rough form first and then produce a base mesh from it.

### How the early version worked

- Looked at an image to understand major contours, proportions, and shape intent
- Created a clean starting mesh that matched what the user drew or described
- Allowed quick edits such as shortening a part, smoothing an edge, or adding a detail
- Focused on giving hardware teams something fast that they could explore ideas with

### Where the system was headed

The main work was moving Taiyaki toward more structured and engineering-friendly output instead of just producing a single mesh.

- Converting meshes into editable CAD so users can adjust dimensions and make changes later
- Breaking shapes into meaningful features such as walls, holes, fillets, and shells rather than leaving everything as one object
- Adding basic manufacturability rules such as consistent wall thickness and cleaner geometry
- Supporting step-by-step refinements so users can continue improving the same model rather than generating a new one each time
- Making it easier to export and use the results in standard CAD tools and for 3D printing or design reviews

The goal was to evolve from generating rough shapes to producing geometry that fits directly into a hardware team's early design workflow.`,
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
    gallery: ["/portfolio/iphone-finewoven.png"],
    body: `I led materials development and mechanical integration for the iPhone FineWoven case, work that resulted in a granted patent. FineWoven was Apple's first major move away from leather in its accessory line, a shift PETA recognized with their 2023 Company of the Year award.

The technical scope sat at the intersection of textile engineering and structural mechanics. I engineered high-performance woven textiles and polymer composites for softgoods enclosures, then designed and ran the manufacturing test protocols that proved out durability and tactile response across the lifecycle of the part.

Specifics under NDA. The broader story, replacing a material that had become a quiet environmental cost with something engineered to perform as well, is the part I'm most proud of.`,
    links: [
      { label: "PETA, Apple wins Company of the Year", url: "https://www.peta.org/media/news-releases/apple-wins-petas-company-of-the-year-award-for-industry-shifting-leadership-on-leather-use/" },
    ],
  },

  {
    slug: "ipad-smart-folio",
    title: "iPad accessories",
    role: "Apple",
    cover: "/portfolio/ipad-smart-folio.png",
    gallery: ["/portfolio/ipad-smart-folio.png"],
    body: `I worked on softgoods engineering for iPad accessories at Apple, designing and prototyping the fabric enclosures that wrap the device. The brief covered materials innovation, user experience, and durability across the full life of the part.

Day-to-day, this meant FEA, materials testing, and iterative prototyping for new form factors, then sitting at the table with mechanical, materials, and manufacturing partners to push each design toward something a factory could actually build at scale. DFM is half of accessory engineering. The other half is making sure the user never has to think about any of it.

Specifics under NDA. The products are publicly available.`,
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
    body: `The pretzel is the namesake of this site, a personal motif I keep coming back to. The shapes shown here are silicone-cast pretzels in a dozen colors, small, palm-sized, somewhere between a charm and a craft prop.

A pretzel is a satisfying object to design around. It's a topological knot drawn from a single line, simple enough to recognize at a glance and complex enough that hand-making one always feels a little bit like an accomplishment. The contrast between the three tight loops and the soft body is part of what makes the form so legible, there's nothing else it could be.

The collection started as personal experiments, silicone molds, food-safe casts, decorative and edible variants, and turned into a small ongoing series. Pretzels show up in my work as a recurring signature: the chosen mascot, the photo prop, the pixel icon in the corner of every page on this site.`,
  },

  // ── Row 3 ─────────────────────────────────────────────
  {
    slug: "harp-instrument",
    title: "Harp instrument",
    role: "Stanford, music + design",
    cover: "/portfolio/metal-lyre.png",
    gallery: [
      "/portfolio/metal-lyre.png",
      "https://freight.cargo.site/w/1500/q/75/i/5f316e3f1e9b700b78da49b45db204f30925010443616c3b327ba6e81214b2c1/1.png",
      "https://freight.cargo.site/w/1500/q/75/i/378ab89aba231e5c712248c7e47fcd07c854907d0c4f560dc8c5bdf9a4fde97b/2.png",
      "https://freight.cargo.site/w/1500/q/75/i/c5a69dd77edf8a1d345da17666dc3c29a9dcd6b3a635f107bd77c5c209e42be7/3.png",
      "https://freight.cargo.site/w/1500/q/75/i/bdf9931c8b8f6db6272ff1e559b9c169a7a8b4ac2e8aa60168cfd5e6e496e0fd/4.png",
    ],
    body: `A small CNC-machined harp made for a Stanford music + product design class. The body is aluminum, the strings steel; the whole instrument fits in one hand and sits at a tabletop scale rather than a concert one.

The class assignment was open, design and build a working stringed instrument, and the constraint I set for myself was that it needed to survive being tuned. Tuning loads are surprisingly high for such a small object. The frame has to resist the cumulative tension of all the strings without warping, and the tuning pegs have to grip well enough that a played string holds pitch through a session.

Designing for sound is its own kind of discipline. You can't simulate it the way you can simulate stress; you build, you listen, you adjust the mass distribution and the string anchor stiffness, and you build the next one. There's a recording linked below.`,
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
    body: `A small membrane-driven whistle exploring how a thin vibrating membrane changes the timbre of a simple tone. Designed for the same Stanford music + product design class as the harp.

A normal whistle uses a fipple, a hard edge that splits an air stream and makes it oscillate at a fixed frequency. A membrane whistle replaces (or adds to) the fipple with a thin sheet of material that vibrates with the airflow, coloring the tone with its own resonance. The result sits somewhere between a kazoo and a flute: breathier than a whistle, more pitched than a kazoo.

The body is a turned aluminum tube; the membrane is a thin polymer film stretched across one end. Most of the design was iteration on the membrane tension and the breath channel geometry, small changes that significantly shift the character of the sound. There's a recording linked below.`,
    links: [
      { label: "Listen", url: "https://drive.google.com/file/d/1tKC5K0He7XORUA2binunJYOy3iCnOWDI/view" },
    ],
  },

  {
    slug: "lil-spider-maze",
    title: "Lil spider maze",
    role: "Stanford, CNC art project",
    cover: "/portfolio/cnc-spider-web.png",
    gallery: [
      "/portfolio/cnc-spider-web.png",
      "https://freight.cargo.site/w/1500/q/75/i/73a3b5a10869285fd3c4bfaf056fd02f57e0ee0a3f143b3cc0727fa9ec4bad60/1.png",
      "https://freight.cargo.site/w/1500/q/75/i/01344e4367bc898402068538e34f9c91dd4a721d8d6c03680b1355b02824deef/3.png",
      "https://freight.cargo.site/w/1500/q/75/i/03057e1a72def3a1bc32e782aafc16e8db1e35ff7d29e4061ab5578099cf5841/4.png",
      "https://freight.cargo.site/w/1500/q/75/i/883d943a980a6324dfd993f22a054355cd5b0a14a734715be1a160ac7694d536/5.png",
      "https://freight.cargo.site/w/1500/q/75/i/ccc3d6d995c9b7fe6c76d895a558fa76462ae2e24f39167bb68ac90328815fa1/6.png",
      "https://freight.cargo.site/w/1500/q/75/i/9b5f2144522cf8f3bd0a846ae127c9b016483750599e558e5b59320662832d0f/7.png",
      "https://freight.cargo.site/w/1920/q/94/i/160a9501ed65260441702b42e39d24b5abd6bfe1fe8abbe725d597ccb5cfb76e/8.png",
    ],
    body: `A small physical puzzle CNC-milled in clear acrylic. A grid of channels forms a spider-web pattern; a metal ball navigates the maze.

This was an exploration in transparent CNC work for a Stanford CNC art class. The clear material was the design choice, it lets you see through the puzzle to the path you've taken, which makes it feel less like a maze and more like a tiny instrument. The web pattern was generated to maximize dead ends without making the puzzle frustrating, and the channels are deep enough to trap the ball but shallow enough to let it slide easily.

The build was a study in toolpath design as much as visual design. Acrylic chips badly if you mill it too aggressively; the right feed rate and step-down keep the channel walls clear and the surface optical. A satisfying object to make and a satisfying object to play with.`,
  },

  // ── Row 4 ─────────────────────────────────────────────
  {
    slug: "injection-molded-fabric",
    title: "Injection-molded fabric",
    role: "Stanford, ME 325 Injection Molding",
    cover: "/portfolio/tbd-gasket-plate.png",
    gallery: [
      "/portfolio/tbd-gasket-plate.png",
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n, i) => {
        const ids = ["bbc2d7e7c8bbb009533c63c9b00de7ac1aeca430657b7ad9335cc2a68a0ce9c1", "c6cb8a27922c47341752cd4629429467ca263ca66b59924e2e9158c2623cb55f", "331f52e7b5e03d904ad3ce029a8b2ff9ff564d2e79ef6513a84de66849ba6fe7", "209d4d93e62430b2d68a6bc50be1ab1f97a3c894e833658ae46b657fabd10c3e", "94c4c345afc11450270b8b01368624149082b326f07c4013c0baa915c25b20a2", "ba92abe2376a09a380a7c641bf635e3b667a5c1f0a1f055c1071ded32cd94e57", "d803a043cf1fd22eb0e5ed624bca58a6f832b70606597311a57d63c8214902a7", "3722104a91ae8018fbcabb32abe9317a59da8e916b9c77fe6800b1a0ecb56982"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
    ],
    body: `Experiments in molding plastic onto and through woven fabric, made for Stanford's ME 325 Injection Molding course. The question was simple: what happens at the boundary between molten plastic and a textile?

The mold tool is a small steel plate with multiple cavities, machined in the Stanford shop. Different fabrics get clamped into the cavities, the mold closes, and pigmented thermoplastic is shot in. The result depends a lot on the weave: tight cottons end up with crisp edges and a good bond; open meshes let resin fully through and create a hybrid material that's part fabric, part plastic. Synthetics melt at the boundary and fuse molecularly. Naturals char if the resin is too hot.

The interesting outputs aren't really parts, they're samples. They show the weave pattern through translucent resin, or end up as soft-shell composites with a textile face and a structural back. As much as anything, the project was a forcing function for thinking about tooling design: cavity venting, gate placement, ejection, the parts of injection molding that are usually invisible in the finished product.`,
  },

  {
    slug: "crocheting",
    title: "Crocheting",
    role: "Personal craft + class instructor",
    cover: "/portfolio/patchwork-cardigan.png",
    gallery: [
      "/portfolio/patchwork-cardigan.png",
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
    body: `Long-running personal craft and one of the things I'd do anywhere if the choice was mine. The patchwork cardigan shown is one of many; each square is an evening, a leftover skein, sometimes a project in itself before it became part of something bigger.

I taught a crochet class at Stanford as part of *Introduction to Crochet Construction and Textile* in fall 2020, a short course covering basic stitches, granny squares, garment shaping, and a final project of the student's choice. The syllabus is linked below.

What I like about crochet is that it's CAD without a computer. Every stitch is a small decision about geometry, the loop you draw through, the direction you wrap, the tension you hold, and those decisions accumulate into a fabric whose drape, weight, and stretch all flow from the choices made one stitch at a time. It's the same discipline as designing in software, just slower and warmer.`,
    links: [
      { label: "Crochet class syllabus", url: "https://drive.google.com/file/d/1SsCSWfZWcnN33-fz_uJsly00cqfyK-uU/view" },
    ],
  },

  {
    slug: "sushi-eating-accessory",
    title: "Sushi-eating accessory",
    role: "Personal project",
    cover: "/portfolio/sushi-accessory.png",
    gallery: [
      "/portfolio/sushi-accessory.png",
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

The form combined a few small jobs that normally need three or four separate dishes: a place to rest chopsticks, a small well for soy sauce, and a low rim that doubled as a serving plate. Designing for a familiar ritual is a particular kind of constraint, anything you add has to disappear into the meal, not call attention to itself.

The studies explored ceramic and silicone variants. The silicone ones were softer and more forgiving; the ceramic ones felt more permanent but were more fragile. There's a version that I still use.`,
  },

  // ── Row 5 ─────────────────────────────────────────────
  {
    slug: "clarinet-tuning-barrel",
    title: "Clarinet tuning barrel",
    role: "Stanford, music + design",
    cover: "/portfolio/clarinet-barrel.png",
    gallery: [
      "/portfolio/clarinet-barrel.png",
      ...[1, 2, 3, 4, 5, 6, 8, 9, 10, 11].map((n, i) => {
        const ids = ["7b6b6aa241421defcc385f8ef2503cee16679d8f66cf1cab46f5b94cf0a99fdd", "4875ff1015f289fd7d3e86256d9df3b24be804a67ada4da7962a7e98a7d086ca", "584426c84e46487ce0e4e6e1e9730f259ecfa07291ad97ee3eacbc2310329a05", "ec60be28d82f8edb1ad126fdb7c431a895c978e2f57892accfe7ae7a41fedd59", "886f7b56e699d04283760b3a39c7aeb4416840bd0ad5d582523f1ce0da666f8f", "d44c9ddb3ed6832f4335141f6cb18484d11d60a0ab71b8f14bc62548a34d3c9f", "05f0ba3ee6d3bdb8971c24f0d3bb068f24d18141de6de09baa0425c12f2da9e8", "69d5045ab8c92c539fda3352a8432b41aaaac904916f38c5e72153121a6087a8", "d5abec0d65713976ba041be43dad1a2a169838e34f6d70c6b6fdb7417a3cfe4c", "3989e6a9e07478842eccb055a992f0d156d36ec53ec54a0d117f9969f76d1b7f"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
    ],
    body: `A precision-machined telescoping barrel for a clarinet, the short section between the mouthpiece and the upper joint. Adjustable length lets the player fine-tune intonation without swapping out an entire barrel.

Made for a Stanford music + product design class. I play clarinet, and the standard solution to intonation drift (the instrument goes flat as the body warms up) is either to pull the barrel out a little or to keep a second longer barrel in your case. A telescoping barrel collapses both options into one and lets you make the adjustment continuously, on the fly.

The construction is two interlocking aluminum sleeves with a precise sliding fit and an o-ring seal to maintain the air column. Most of the design work was the fit itself, too loose and the seal leaks; too tight and the player can't move it mid-piece. Designing for a musician means thinking about the millimeters that affect intonation and the feel of the instrument under the fingers at the same time.`,
  },

  {
    slug: "dough-roller",
    title: "Dough roller",
    role: "Kitchen tool study",
    cover: "/portfolio/dumpling-press.png",
    gallery: [
      "/portfolio/dumpling-press.png",
      ...[1, 2, 3, 4, 5, 6].map((n, i) => {
        const ids = ["ee0c338cbbbf1f2d8f47d2a57698c9a0fb109832aad3d0444175e8752967804e", "333652cacf01770950ee855b2d0324d54b57e0897c5e206de04e102efeac6021", "63a65b873cfb99a101abbd231d8c8b3ca7241c9263e4940e46ef44d56f0d947e", "2e3eb93f0bcd7ca14f848fb74f08fa8fe68d30b620d4f621ecd967da277988f5", "f57cae728e99845bfb03901fbb3175e2545aa2f5da9b9449826ac65d70b2868a", "86cbb0839a699b11be24b101def4fcb03f61859080f744dbdeec6481bcc9a75f"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.png`;
      }),
      "https://freight.cargo.site/w/1920/q/94/i/605e5b3876096abb69900e778aceaaa537b3d3d075ed47085b5ba85582f6f057/7.png",
    ],
    body: `A kitchen tool designed for making dumpling and gyoza skins. Standard rolling pins are sized for pie crust and pasta sheets; a single-skin roller is a different problem.

The brief was efficiency and feel. Each skin gets one pass, center the dough ball, roll once with rotation, you have a skin. Repeat eighty times for a family meal. The handle had to be comfortable for that volume of repetition, the roller weighted enough that the user could glide rather than press, and the whole thing easy to wash and dry between batches.

The form is a stout wooden roller with a soft-grip handle, balanced so the weight does the work. Compact enough to keep on a hook by the stove. A small object that quietly changes a familiar kitchen task.`,
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
    body: `A fixture designed for bending US quarters on a benchtop arbor press. Made for a Stanford fixture-design exercise, a constrained problem with all the texture of real machine-shop work.

The challenge was force and geometry. A quarter is a small disc of copper-nickel cladding over a copper core; bending it cleanly requires substantial localized force without cracking the coin or galling the die. I calculated the force budget, designed a die geometry that produced a consistent fold, and machined the fixture to fit a standard benchtop arbor press.

What surprised me was how much the fixture geometry mattered relative to the press itself. The bench press has more than enough force; the limit was how cleanly I could constrain the coin. Get the support geometry right and the bend is repeatable across many trials. Get it slightly off and the coin cracks, slips, or curls unpredictably. Full report linked below.`,
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
    gallery: [
      "/portfolio/pearl-applicator.png",
      ...[1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22].map((n) => {
        const ids = ["1a07f8182821b3622d40d01042331acfb4a89002e6e99d988701e118379ebdba", "e0057b94f3b051cf5482b18067e33adb7a2f3242a94df7c3ff12639789606246", "259160f7d050247b677776e54909868d2bdaaa8968456a769cea819f20ff5ae8", "ca2577bec0f6f89485e6973a6bc859abfca5af99408e8cd51079425a525a3b21", "75cabc4696d174f8838eb419f2f0e201d26555ba1a01d5b8b009f0130b215f58", "1f1f379e78c93928bc7efb1e3cae51d1ea4def609fe2092f88c635360ddb06c8", "1be3bebde9762f1bfe4ab5a8cfb8ad861f40376fd39394774993ba67c6445520", "23f4aae7caca3969f2561451c3910cb206826f72cf1b56e87164d4308000100e", "82f6a8ea147a4b530662ca3be55df73993802f00473c09e54c30ad18d5552dd2", "9b68bace6ba69ecdf44ab0227e8bdc92dcb3c5e8b41114276a4dcb20f9ff29cd", "84404c5ec9c8ccd49023a080c14af57f936cc0dcc84706e3dacda09dca7d9931", "867f5e40a45ae5a72c61a300aa45582f7dc4f931b5d96c24b4d607ee76ab4fba", "6de2f6e54b67da062fcd863412d7bb185a7ba7db3b82eeaa6e176b9b45b77308", "bdeb049993eeb6c29779a819b2cf62d093c516ae437fdaa2f0243c6c60cfed1f", "412f0de2feb5762e7fb93c667e7e88437b5534b6d0458786a82a5350197c491b", "eaf7d043e29a51cd0fc2024a244abd971d76d83a80dd4571d02b0d7def46854c", "11a3a166b404ed6207c661757065c4fda311126a87319aa03d04dea75579a92b", "59e1c5ead5af9a287e1ce0291c9dad057405530c353f7971c63f358f25d7af2d", "c4e1e80f51599a954c1a7dc80a3bbc20ff05e381ba9919be498a7541b812f3e2", "b6bf5b80bf3fe30515a638a53c81caa17b33d2bed331d227f68cdf2949064aca"];
        const i = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22].indexOf(n);
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
    ],
    body: `A reusable case for menstrual products, a small study in how an everyday personal object can feel intentional rather than disposable.

The constraints were practical and emotional. Practical: discreet in a bag, easy to open one-handed, washable, durable. Emotional: warm to the touch, satisfying to hold, none of the design defensiveness that period products usually carry. I wanted something that read as just a nice object, the way a good lipstick case does, and only revealed its purpose if you opened it.

The form went through a lot of iterations: clay studies for hand feel, 3D prints to test opening mechanics, silicone overmolds for grip. The version shown is a small soft-touch capsule with a clean snap closure. It sits in a bag like a balm or a small flask. That was the point.`,
  },

  {
    slug: "raccoon-poker-chip",
    title: "Raccoon poker chip",
    role: "Stanford, ME 325 Injection Molding",
    cover: "/portfolio/tbd-panda-soap.png",
    gallery: [
      "/portfolio/tbd-panda-soap.png",
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n, i) => {
        const ids = ["42d9ef15076f62fab0abee3ee39819bf9d8bff9f697eb0ca533ad18559e22700", "3ec0e0a4adfe4b880ccec020c0edee1f99a7a33bb05943192da6964d5ea76d22", "d2e85ab8bd3ab98866787a2d016ca962ac8bc5f2230826b636b47f53d73a3ab1", "7defddb77c927a28b3ca5f4d8dd9fd9c37a871a5ede54496cb6b6f63e9dda139", "97bd01bbbfb5a12649185b9729cdd00b020184b435d8be8575a2911c332f0562", "d0f6d84e8a91ffeb248e0bf1859b05621ddf36c2491f940cdef7d3c22a141b75", "153d556c89ffeceafda7f223ea4758408ceaf7f62a6d0c9fe918fdbf2b163eb7", "567e91be77e07fbf3ec5b95c8e2600729c5b743c249c34475ee3cc7d6e55ba0e", "d17933e07abae064339eb04e8b63758367602a7424b7866fea572a76fee69e28", "6e90155278aa4a3765beca0dec98f90b047f5ed046fdae7f297001e26adbfb1e", "b503e5500fa7c67feacc258133b69b82f7890aa5ca647586e0e895e51bca71ef", "d1d7c4ed0c8186914b263e4f94686389cb65291d8e1ff199b7fde09aa2420afa"];
        return `https://freight.cargo.site/w/1500/q/75/i/${ids[i]}/${n}.jpg`;
      }),
    ],
    body: `A custom-tooled poker chip with a raccoon emboss, designed and produced through the full injection-molding pipeline for Stanford's ME 325. The motif chose itself; the design exercise was the same regardless of subject.

The work was end-to-end: CAD design of the chip, parting line strategy, ejector pin layout, sprue and runner sizing, gate placement, vent geometry. The mold tool was machined in the Stanford shop, manual operations for the simpler features, CNC for the raccoon emboss and the lettering around the rim. Once the tool was running, every shot tells you something about how cleanly you set up the cavity: short-shots from undersized gates, flash from worn parting surfaces, sink marks from thick sections that don't pack out evenly.

The chips themselves are pigmented styrene. They stack well, they have a satisfying weight, and they bear the marks of every decision made in the tool. As an exercise, injection molding teaches that the part you ship is downstream of the geometry you carve into steel.`,
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
    body: `A teardown and mechanical analysis of an Intuitive Surgical small grasping retractor, the kind of instrument that lives at the end of a robotic surgery system's arm and gently holds tissue out of the way for the surgeon.

The goal was to understand how the design works. Surgical instruments are constrained by an unusual combination of demands: precision at sub-millimeter scale, repeated sterilization that can be mechanically harsh, fine articulation through a port the diameter of a pen. Disassembling the unit revealed the linkage geometry, the cable routing that turns motor inputs at one end into jaw motion at the other, the spring system that returns the jaws to a default state if the cable goes slack.

The teardown was a study in how mature engineering looks: nothing is over-built, but every detail is deliberate. The cable routing avoids friction. The pivot pins are pressed in such a way that they can't migrate during sterilization cycles. The jaws have a textured grip pattern matched to typical tissue stiffness. A useful frame for thinking about my own designs, what's in this thing on purpose, and what's a habit you should question. Full Medium write-up linked below.`,
    links: [
      { label: "Full Medium write-up", url: "https://medium.com/@amyzhou_99330/intuitive-surgical-small-grasping-retractor-teardown-14131aef2c20" },
    ],
  },
];
