import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Heading = "h2" | "h3" | "h4";

/* Title + one line of description: the caption under a tile and the text of a row. */
function ItemText({ as: H, title, text }: { as: Heading; title: string; text?: string }) {
  return <><H className="ui-item-title">{title}</H>{text && <p className="ui-item-text">{text}</p>}</>;
}

/* An image on the media surface with a caption, linking to its page. */
export function Tile({ href, image, title, text, priority, compact, as = "h2" }: { href: string; image: string; title: string; text?: string; priority?: boolean; compact?: boolean; as?: Heading }) {
  return (
    <Link href={href} className="ui-tile">
      <div className="ui-media ui-tile-media">
        <Image src={image} alt={title} fill sizes={compact ? "(min-width: 1024px) 260px, (min-width: 768px) 33vw, 50vw" : "(min-width: 1024px) 360px, 50vw"} priority={priority} />
      </div>
      <div className="ui-tile-caption"><ItemText as={as} title={title} text={text} /></div>
    </Link>
  );
}

/* "compact" is the smaller grid for secondary work: four across on wide screens instead of three. */
export function TileGrid({ label, compact, children }: { label: string; compact?: boolean; children: ReactNode }) {
  return <section className={compact ? "ui-tile-grid ui-tile-grid--compact" : "ui-tile-grid"} aria-label={label}>{children}</section>;
}

/* A text-only list entry sitting on a hairline. */
export function Row({ href, title, text, as = "h3" }: { href: string; title: string; text?: string; as?: Heading }) {
  return <Link href={href} className="ui-row"><ItemText as={as} title={title} text={text} /></Link>;
}

/* Rows under a label in the left margin. */
export function RowGroup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="ui-row-group"><h3 className="ui-row-group-title">{title}</h3><div>{children}</div></div>;
}
