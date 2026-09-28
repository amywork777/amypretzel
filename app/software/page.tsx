import type { Metadata } from "next";
import { Page, PageIntro, SectionHeading, SiteFooter } from "../_ui/layout";
import SoftwareProjectList from "./project-list";

export const metadata: Metadata = {
  title: "Software",
  description: "Software by Amy Zhou: AI design tools, CAD systems, maps, and small useful apps.",
  alternates: { canonical: "/software" },
};

export default function SoftwarePage() {
  return (
    <Page active="software">
      <PageIntro title="Software.">AI design tools, CAD systems, and small things that make everyday work better.</PageIntro>
      <section aria-labelledby="all-software-title">
        <SectionHeading id="all-software-title">All software</SectionHeading>
        <SoftwareProjectList />
      </section>
      <SiteFooter />
    </Page>
  );
}
