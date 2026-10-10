import type { Metadata } from "next";
import { Page, PageIntro, SectionHeading, SiteFooter } from "../_ui/layout";
import { facts } from "./facts";
import { FoldFigure } from "./fold-figures";

export const metadata: Metadata = {
  title: "Cool facts",
  description: "Cool facts Amy Zhou has collected about making physical things.",
  alternates: { canonical: "/facts" },
  // A secret page: reached from the stray pretzel on the homepage, not from search.
  robots: { index: false, follow: false },
};

export default function FactsPage() {
  return (
    <Page>
      <PageIntro title="Cool facts.">Things about making physical stuff that I think are neat.</PageIntro>
      <section aria-labelledby="all-facts-title">
        <SectionHeading id="all-facts-title">All facts</SectionHeading>
        {facts.map(f => (
          <article key={f.slug} id={f.slug} className="ui-fact" aria-labelledby={`${f.slug}-title`}>
            <header>
              <h3 id={`${f.slug}-title`} className="ui-item-title">{f.title}</h3>
              <p className="ui-item-text">{f.subject}</p>
            </header>
            <div className="ui-prose">
              {f.body.map((p, i) => <p key={i}>{p}</p>)}
              {f.figure && <figure className="fact-figure"><FoldFigure {...f.figure} scale={1.7} /></figure>}
              {f.toolbox && <>
                <h4>{f.toolbox.title}</h4>
                <div className="fact-toolbox">
                  {f.toolbox.techniques.map(t => (
                    <figure key={t.name} className="fact-figure">
                      <FoldFigure {...t.figure} />
                      <figcaption><strong>{t.name}</strong> {t.text}</figcaption>
                    </figure>
                  ))}
                </div>
              </>}
            </div>
          </article>
        ))}
      </section>
      <SiteFooter />
    </Page>
  );
}
