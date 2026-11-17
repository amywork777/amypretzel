import Image from "next/image";
import Link from "next/link";

type Neighbour = { href: string; title: string; image?: string; cutout?: boolean };

function Side({ label, n }: { label: string; n: Neighbour }) {
  return (
    <Link href={n.href}>
      {n.image && (
        <span className={n.cutout ? "ui-prev-next-pic ui-cutout" : "ui-prev-next-pic"}>
          <Image src={n.image} alt="" fill sizes="72px" />
        </span>
      )}
      <span className="ui-prev-next-text"><small>{label}</small>{n.title}</span>
    </Link>
  );
}

/* Previous / next at the foot of a detail page, each with its picture. */
export function PrevNext({ label, prev, next }: { label: string; prev: Neighbour; next: Neighbour }) {
  return (
    <nav className="ui-prev-next" aria-label={label}>
      <Side label="Previous" n={prev} />
      <Side label="Next" n={next} />
    </nav>
  );
}
