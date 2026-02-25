export function About() {
  return (
    <section id="about" className="scroll-mt-12 py-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-10">
          <hr className="flex-1 border-[var(--color-rule)]" />
          <h2 className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-muted)]">
            about
          </h2>
          <hr className="flex-1 border-[var(--color-rule)]" />
        </div>
        <div className="max-w-xl mx-auto text-sm leading-[1.8] text-neutral-700 text-center space-y-4">
          <p>
            {/* TODO: replace with actual bio content */}
            amy zhou is a design engineer working at the intersection of
            physical and digital design.
          </p>
        </div>
      </div>
    </section>
  );
}
