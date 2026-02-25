export function Portfolio() {
  return (
    <section id="portfolio" className="scroll-mt-12">
      <div className="max-w-3xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-4">
          <hr className="flex-1 border-[var(--color-rule)]" />
          <h2 className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-muted)]">
            portfolio
          </h2>
          <hr className="flex-1 border-[var(--color-rule)]" />
        </div>
      </div>
      <div className="w-full">
        <iframe
          src="https://delightful-may-f04.notion.site/ebd/23bfc3fa1d2a801eaa57cf367b68b68d"
          className="w-full border-0"
          style={{ height: "80vh" }}
          loading="lazy"
          title="portfolio"
        />
      </div>
    </section>
  );
}
