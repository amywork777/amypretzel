import Link from "next/link";
import type { ReactNode } from "react";

type LinkProps = { href: string; children: ReactNode; className?: string };

const isExternal = (href: string) => /^https?:\/\//.test(href);

/* The one inline link: ink text, a hairline underline, a softer ink on hover.
   External links open in a new tab; internal ones go through next/link. */
export function TextLink({ href, children, className }: LinkProps) {
  const cls = className ? `ui-link ${className}` : "ui-link";
  if (isExternal(href)) return <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{children}</a>;
  if (href.startsWith("mailto:")) return <a href={href} className={cls}>{children}</a>;
  return <Link href={href} className={cls}>{children}</Link>;
}

/* A quiet, un-underlined link for secondary navigation ("Home"). */
export function QuietLink({ href, children }: LinkProps) {
  return <Link href={href} className="ui-quiet-link">{children}</Link>;
}

/* A wrapping row of small links: contact links, a project's references. */
export function LinkList({ label, links }: { label: string; links: { href: string; label: string }[] }) {
  return (
    <nav className="ui-link-list" aria-label={label}>
      {links.map(l => <TextLink key={l.href} href={l.href}>{l.label}</TextLink>)}
    </nav>
  );
}
