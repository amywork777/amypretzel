import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Portfolio } from "@/components/portfolio";
import { About } from "@/components/about";
import { LinksSection } from "@/components/links-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Portfolio />
        <About />
        <LinksSection />
      </main>
      <Footer />
    </>
  );
}
