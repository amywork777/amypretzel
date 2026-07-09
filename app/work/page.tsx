import type { Metadata } from "next";
import SiteNav from "../site-nav";
import WorkBook from "./book";
import { workChapters } from "./projects";

export const metadata: Metadata = {
  title: "Work",
  description:
    "A book-like catalog of projects by Amy Zhou: AI tools, CAD systems, software, jewelry, hardware, softgoods, instruments, and physical objects.",
  alternates: { canonical: "/work" },
  openGraph: {
    type: "website",
    url: "/work",
    title: "Work, Amy Zhou",
    description:
      "A book-like catalog of software, hardware, AI tools, jewelry, softgoods, instruments, and physical objects by Amy Zhou.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Work, Amy Zhou",
    description:
      "A book-like catalog of software, hardware, AI tools, jewelry, softgoods, instruments, and physical objects.",
  },
};

export default function WorkPage() {
  return (
    <div className="work-book-page min-h-screen bg-paper">
      <SiteNav />

      <main className="work-book-main">
        <h1 className="sr-only">Amy Zhou work diary</h1>
        <section className="work-book-room">
          <WorkBook chapters={workChapters} />
        </section>
      </main>
    </div>
  );
}
