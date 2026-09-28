import Link from "next/link";

type Neighbour = { href: string; title: string };

/* Previous / next at the foot of a detail page. */
export function PrevNext({ label, prev, next }: { label: string; prev: Neighbour; next: Neighbour }) {
  return (
    <nav className="ui-prev-next" aria-label={label}>
      <Link href={prev.href}><small>Previous</small>{prev.title}</Link>
      <Link href={next.href}><small>Next</small>{next.title}</Link>
    </nav>
  );
}
