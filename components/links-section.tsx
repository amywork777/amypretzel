const links = [
  { label: "linkedin", href: "https://linkedin.com/in/amyzhou" },
  { label: "github", href: "https://github.com/amyzhou" },
  { label: "email", href: "mailto:amy@example.com" },
  // TODO: replace with actual links
];

export function LinksSection() {
  return (
    <section id="links" className="scroll-mt-12 py-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-10">
          <hr className="flex-1 border-[var(--color-rule)]" />
          <h2 className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-muted)]">
            links
          </h2>
          <hr className="flex-1 border-[var(--color-rule)]" />
        </div>
        <ul className="flex flex-col items-center gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-500 hover:text-black transition-colors duration-200 inline-flex items-center gap-1.5 group"
              >
                {link.label}
                <span className="inline-block translate-x-0 group-hover:translate-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
