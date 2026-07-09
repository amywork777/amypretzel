export type BookPage = {
  title: string;
  text: string;
};

export type BookChapter = {
  id: string;
  title: string;
  kicker: string;
  pages: BookPage[];
};

export const bookChapters: BookChapter[] = [
  {
    id: "roots",
    title: "Roots",
    kicker: "Chapter 01",
    pages: [
      {
        title: "hardware, software, and the in-between",
        text: "Hi, I'm Amy. I make objects you can hold, tools you can use, and the strange wonderful space between them. This little book is the short story of how I got here.",
      },
      {
        title: "a kid who made things",
        text: "Before I had words for any of it, I was already making — drawing, folding, gluing, taking things apart to see what was inside. Crafts weren't a hobby. They were how I thought.",
      },
      {
        title: "music, too",
        text: "Music ran alongside everything. Practicing an instrument taught me that small efforts compound, and that precision and feeling are not opposites.",
      },
    ],
  },
  {
    id: "stanford",
    title: "Stanford",
    kicker: "Chapter 02",
    pages: [
      {
        title: "product design at stanford",
        text: "I studied product design and mechanical engineering at Stanford, with a minor in music. It gave me permission to move between form, engineering, and feeling without choosing one.",
      },
      {
        title: "learning by building",
        text: "I learned to sketch, machine, mold, and prototype — and that the fastest way to understand anything is to try to build it yourself.",
      },
      {
        title: "people first",
        text: "The lesson that stuck: start with people. The best objects answer a real need and still manage to feel personal, like they were made for one person in particular.",
      },
    ],
  },
  {
    id: "apple",
    title: "Apple",
    kicker: "Chapter 03",
    pages: [
      {
        title: "cupertino",
        text: "After Stanford I joined Apple as a product design engineer, working on hardware that aimed to be useful, durable, and better for the environment.",
      },
      {
        title: "materials and longevity",
        text: "I obsessed over materials, tolerances, and what happens to a product after years in a pocket or a bag. Good hardware is a promise you keep for a long time.",
      },
      {
        title: "a thousand quiet decisions",
        text: "Apple taught me what shipping at scale really takes — the thousand quiet decisions between a beautiful prototype and a million real units.",
      },
    ],
  },
  {
    id: "building",
    title: "Building",
    kicker: "Chapter 04",
    pages: [
      {
        title: "striking out",
        text: "Eventually I wanted to build things end to end. I co-founded Mobius, working to bring transparency and efficiency to materials trading and recycling.",
      },
      {
        title: "taiyaki",
        text: "Then came Taiyaki, an AI concept-to-CAD system that turns sketches and references into editable 3D geometry — the start of a long obsession with making manufacturing easier.",
      },
      {
        title: "taya",
        text: "I designed Taya, a wearable AI journal disguised as jewelry, and built a pipeline that turned personal sketches into real, castable metal pieces.",
      },
      {
        title: "the in-between",
        text: "Software that makes physical things. Objects with software souls. Somewhere in there I stopped separating the two — the in-between became the whole point.",
      },
    ],
  },
  {
    id: "now",
    title: "Now",
    kicker: "Chapter 05",
    pages: [
      {
        title: "vizcom",
        text: "Today I'm at Vizcom in San Francisco, building AI tools for industrial designers — features that help ideas move from rough sketch to real product.",
      },
      {
        title: "still making",
        text: "Off hours I keep making: a geometry kernel, CAD datasets, a map of free things to do in the city, a cuter terminal, crochet animals, and too many pretzel-shaped objects.",
      },
      {
        title: "say hi",
        text: "I love meeting people who make things. The projects, details, and pictures all live on the website — turn the page, or just come say hi.",
      },
    ],
  },
];
