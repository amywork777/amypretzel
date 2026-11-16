import Image from "next/image";
import Link from "next/link";

type Heading = "h2" | "h3" | "h4";

/* The caption under a tile: the title, with the year beside it when there is
   one, then at most one line of description. */
function ItemText({ as: H, title, text, year }: { as: Heading; title: string; text?: string; year?: string }) {
  const heading = <H className="ui-item-title">{title}</H>;
  return <>
    {year ? <div className="ui-item-head">{heading}<span className="ui-item-year">{year}</span></div> : heading}
    {text && <p className="ui-item-text">{text}</p>}
  </>;
}

/* An image on the media surface with a caption, linking to its page.
   "small" is the thumbnail size used in a FoldGrid. "fill" is for screenshots:
   the picture covers the frame instead of sitting on it as an object.
   "year" sits soft beside the title. */
export function Tile({ href, image, title, text, year, priority, small, fill, as = "h2" }: { href: string; image: string; title: string; text?: string; year?: string; priority?: boolean; small?: boolean; fill?: boolean; as?: Heading }) {
  return (
    <Link href={href} className="ui-tile">
      <div className={fill ? "ui-media ui-tile-media ui-tile-media--fill" : "ui-media ui-tile-media"}>
        <Image src={image} alt={title} fill sizes={small ? "(min-width: 1024px) 180px, (min-width: 640px) 25vw, 33vw" : "(min-width: 1024px) 360px, 50vw"} priority={priority} />
      </div>
      <div className="ui-tile-caption"><ItemText as={as} title={title} text={text} year={year} /></div>
    </Link>
  );
}
