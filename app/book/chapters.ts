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
        title: "hi",
        text: "hi, i'm amy. i make hardware, software, and whatever sits in between. this little book is the short version of how i got here.",
      },
      {
        title: "a kid who made things",
        text: "i've been making things since before i can remember. drawing, folding, gluing, taking stuff apart to see what was inside. crafts and music weren't hobbies, they were just how i thought.",
      },
    ],
  },
  {
    id: "stanford",
    title: "Stanford",
    kicker: "Chapter 02",
    pages: [
      {
        title: "stanford",
        text: "i studied product design and mechanical engineering at stanford, with a minor in music. i learned to sketch, machine, mold, and prototype. the fastest way to understand anything is to just try to build it.",
      },
    ],
  },
  {
    id: "apple",
    title: "Apple",
    kicker: "Chapter 03",
    pages: [
      {
        title: "apple",
        text: "then apple, as a product design engineer. i got a little obsessed with materials and durability, and learned what shipping at scale actually takes. about a million tiny decisions between a pretty prototype and a million real units.",
      },
    ],
  },
  {
    id: "building",
    title: "Building",
    kicker: "Chapter 04",
    pages: [
      {
        title: "building",
        text: "eventually i wanted to build things end to end. a materials recycling startup, an ai concept-to-cad tool, a wearable ai journal disguised as jewelry.",
      },
      {
        title: "the in-between",
        text: "software that makes physical things. objects with software inside. at some point i stopped separating the two.",
      },
    ],
  },
  {
    id: "now",
    title: "Now",
    kicker: "Chapter 05",
    pages: [
      {
        title: "now",
        text: "now i'm at vizcom in san francisco, building ai tools for industrial designers. off hours i'm still making — maps, terminals, crochet animals, pretzel-shaped objects.",
      },
      {
        title: "say hi",
        text: "i love meeting people who make things. everything else lives on the website. say hi :)",
      },
    ],
  },
];
