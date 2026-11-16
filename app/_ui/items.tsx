import Image from "next/image";
import Link from "next/link";

type Heading = "h2" | "h3" | "h4";

/* Title + one line of description: the caption under a tile and the text of a row. */
function ItemText({ as: H, title, text }: { as: Heading; title: string; text?: string }) {
  return <><H className="ui-item-title">{title}</H>{text && <p className="ui-item-text">{text}</p>}</>;
}

/* An image on the media surface with a caption, linking to its page.
   "small" is the thumbnail size used in a FoldGrid. "fill" is for screenshots:
   the picture covers the frame instead of sitting on it as an object.
   "meta" is a soft line after the text, such as where and when. */
export function Tile({ href, image, title, text, meta, priority, small, fill, as = "h2" }: { href: string; image: string; title: string; text?: string; meta?: string; priority?: boolean; small?: boolean; fill?: boolean; as?: Heading }) {
  return (
    <Link href={href} className="ui-tile">
      <div className={fill ? "ui-media ui-tile-media ui-tile-media--fill" : "ui-media ui-tile-media"}>
        <Image src={image} alt={title} fill sizes={small ? "(min-width: 1024px) 180px, (min-width: 640px) 25vw, 33vw" : "(min-width: 1024px) 360px, 50vw"} priority={priority} />
      </div>
      <div className="ui-tile-caption"><ItemText as={as} title={title} text={text} />{meta && <p className="ui-tile-meta">{meta}</p>}</div>
    </Link>
  );
}
