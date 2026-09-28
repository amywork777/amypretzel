import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Heading = "h2" | "h3" | "h4";

/* Title + one line of description: the caption under a tile and the text of a row. */
function ItemText({ as: H, title, text }: { as: Heading; title: string; text?: string }) {
  return <><H className="ui-item-title">{title}</H>{text && <p className="ui-item-text">{text}</p>}</>;
}

/* An image on the media surface with a caption, linking to its page. */
export function Tile({ href, image, title, text, priority, as = "h2" }: { href: string; image: string; title: string; text?: string; priority?: boolean; as?: Heading }) {
  return (
    <Link href={href} className="ui-tile">
      <div className="ui-media ui-tile-media">
        <Image src={image} alt={title} fill sizes="(max-width: 700px) 100vw, 50vw" priority={priority} />
      </div>
      <div className="ui-tile-caption"><ItemText as={as} title={title} text={text} /></div>
    </Link>
  );
}

export function TileGrid({ label, children }: { label: string; children: ReactNode }) {
  return <section className="ui-tile-grid" aria-label={label}>{children}</section>;
}

/* A text-only list entry sitting on a hairline. */
export function Row({ href, title, text, as = "h3" }: { href: string; title: string; text?: string; as?: Heading }) {
  return <Link href={href} className="ui-row"><ItemText as={as} title={title} text={text} /></Link>;
}

/* Rows under a label in the left margin. */
export function RowGroup({ title, children }: { title: string; children: ReactNode }) {
  return <div className="ui-row-group"><h3 className="ui-row-group-title">{title}</h3><div>{children}</div></div>;
}
