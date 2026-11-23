import Image from "next/image";
import SiteNav from "./site-nav";
import { LinkList } from "./_ui/link";
import { SiteFooter } from "./_ui/layout";
import { OpenOnHash } from "./_ui/open-on-hash";
import { GroupMark } from "./_ui/group-marks";
import { Earlier, Group, List } from "./_ui/list";
import { workGroups } from "./work";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Amy Zhou",
  alternateName: "amypretzel",
  url: "https://amypretzel.com",
  image: "https://amypretzel.com/amy-portrait.jpg",
  description:
    "Builds objects, and software to build objects. Building AI tools for industrial designers at Vizcom. Previously Apple, Stanford.",
  worksFor: { "@type": "Organization", name: "Vizcom", url: "https://www.vizcom.ai" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Stanford University", url: "https://www.stanford.edu" },
  ],
  knowsAbout: [
    "Product design",
    "CAD software",
    "AI tools for engineers",
    "Mechanical engineering",
    "Industrial design",
    "AI hardware",
    "Wearables",
    "Jewelry design",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    addressCountry: "US",
  },
  sameAs: [
    "https://x.com/amypretzel",
    "https://linkedin.com/in/amy7",
    "https://github.com/amywork777",
  ],
};

const contactLinks = [
  { href: "mailto:amzyst@gmail.com", label: "Email" },
  { href: "https://x.com/amypretzel", label: "Twitter" },
  { href: "https://github.com/amywork777", label: "GitHub" },
  { href: "https://linkedin.com/in/amy7", label: "LinkedIn" },
  { href: "/amy-zhou-resume.pdf", label: "Resume" },
];

/* Amy's own bio and portrait, then the things grouped by kind (app/work.ts),
   each group closed to one line with a strip of its pictures so the page
   stays short. Opened, a group is a plain list like Felix Rieseberg's site:
   a picture, a title, one line and a year. */
export default function Home() {
  return (
    <div className="home-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <SiteNav column="list" />
      <main id="main-content" className="ui-column ui-column--list">
        <section id="about" className="home-intro" aria-labelledby="intro-title">
          <h1 id="intro-title" className="sr-only">Amy Zhou</h1>
          <p className="ui-display home-statement">I like building objects, and software to build objects.</p>
          <div className="personal-intro">
            <Image className="personal-portrait" src="/amy-portrait.jpg" alt="Amy Zhou" width={800} height={800} sizes="110px" priority />
            <div className="personal-copy ui-prose">
              <p>Now at <strong>Vizcom</strong>. Before that I had a startup where we explored a few ideas: materials recycling, AI concept-to-CAD, and an AI journal you wear as jewelry. Earlier, <strong>Apple</strong> and <strong>Stanford</strong>.</p>
              <p>Mostly interested in AI for CAD, engineering, and making physical things.</p>
              <LinkList label="Contact Amy" links={contactLinks} />
            </div>
          </div>
        </section>
        <div id="work" className="home-groups">
          {workGroups.map(g => (
            <Group key={g.id} id={g.id} title={g.title} note={g.note} items={g.items} mark={<GroupMark id={g.id} />}>
              <List items={g.items} label={g.title} />
              {g.earlier && (
                <Earlier title="Earlier, at Stanford and home">
                  <List items={g.earlier} label="Earlier objects" small />
                </Earlier>
              )}
            </Group>
          ))}
        </div>
        <OpenOnHash />
        <SiteFooter />
      </main>
    </div>
  );
}
