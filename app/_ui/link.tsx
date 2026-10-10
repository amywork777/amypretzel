import Link from "next/link";
import type { ReactNode } from "react";

/* standalone: the full-size pill button, for links that stand on their own
   rather than sitting inside a sentence. */
type LinkProps = { href: string; children: ReactNode; className?: string; standalone?: boolean };

const isExternal = (href: string) => /^https?:\/\//.test(href);

/* The one link: a pill that fills with ink on hover, like the pill button.
   External links open in a new tab; internal ones go through next/link. */
export function TextLink({ href, children, className, standalone }: LinkProps) {
  const base = standalone ? "ui-button ui-button--pill" : "ui-link";
  const cls = className ? `${base} ${className}` : base;
  if (isExternal(href)) return <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{children}</a>;
  if (href.startsWith("mailto:")) return <a href={href} className={cls}>{children}</a>;
  return <Link href={href} className={cls}>{children}</Link>;
}

/* A wrapping row of small links: contact links, a project's references. */
export function LinkList({ label, links }: { label: string; links: { href: string; label: string }[] }) {
  return (
    <nav className="ui-link-list" aria-label={label}>
      {links.map(l => <TextLink key={l.href} href={l.href} standalone>{l.label}</TextLink>)}
    </nav>
  );
}
