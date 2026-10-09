import type { PretzelKind } from "./pretzel-geometry";

// A short life story, one chapter to a pretzel, ending with a goodbye. Each
// chapter is its own kind of pretzel in the bowl.

export type BookChapter = {
  id: string;
  title: string;
  text: string;
  pretzel: PretzelKind;
};

export const bookChapters: BookChapter[] = [
  {
    id: "roots",
    pretzel: "sprinkles",
    title: "a kid who made things",
    text: "hi, i'm amy. i've been making things since before i can remember: drawing, folding, gluing, taking stuff apart to see what was inside. crafts and music were just how i thought.",
  },
  {
    id: "studies",
    pretzel: "salt",
    title: "design and engineering",
    text: "i studied product design and mechanical engineering at stanford, with a minor in music. i learned to sketch, machine, mold and prototype. the fastest way to understand anything is to build it.",
  },
  {
    id: "shipping",
    pretzel: "chocolate",
    title: "shipping at scale",
    text: "then apple, as a product design engineer. i got a little obsessed with materials and durability, and learned the million tiny decisions between a pretty prototype and a million real units.",
  },
  {
    id: "building",
    pretzel: "everything",
    title: "building end to end",
    text: "then i wanted to build things end to end: a materials recycling startup, an ai concept-to-cad tool, and a wearable ai journal disguised as jewelry.",
  },
  {
    id: "now",
    pretzel: "cinnamon",
    title: "now",
    text: "now i'm at vizcom in san francisco, building ai tools for industrial designers. off hours i'm still making maps, terminals, crochet animals and pretzel-shaped objects.",
  },
];

export const bookEnding: BookChapter = {
  id: "hi",
  pretzel: "mauve",
  title: "say hi",
  text: "that's the short version. everything else lives on the website: objects, and software to build objects. i love meeting people who make things.",
};

export const storyChapters = [...bookChapters, bookEnding];
