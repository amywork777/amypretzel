const links = [
  { label: "linkedin", href: "https://linkedin.com/in/amyzhou" },
  { label: "github", href: "https://github.com/amyzhou" },
  { label: "email", href: "mailto:amy@example.com" },
  // TODO: replace with actual links
];

export function LinksSection() {
  return (
    <section id="links" className="scroll-mt-14 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <hr className="border-gray-200 mb-6" />
        <h2 className="text-sm font-medium mb-8">links</h2>
        <ul className="space-y-3">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline underline-offset-4 inline-flex items-center gap-1 group"
              >
                {link.label}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
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
