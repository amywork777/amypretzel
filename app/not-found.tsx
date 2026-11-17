import type { Metadata } from "next";
import { Page, PageIntro, SiteFooter } from "./_ui/layout";
import { LinkList } from "./_ui/link";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

/* A missing page keeps the site around it: the header, a plain line, a way
   back to the work. */
export default function NotFound() {
  return (
    <Page width="narrow">
      <PageIntro title="Nothing here.">This page moved, or never existed.</PageIntro>
      <div className="ui-not-found">
        <LinkList label="Where to go" links={[{ href: "/#work", label: "See the work" }, { href: "/#about", label: "About Amy" }]} />
      </div>
      <SiteFooter />
    </Page>
  );
}
