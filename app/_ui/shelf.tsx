import Image from "next/image";
import Link from "next/link";

export type ShelfItem = { href: string; image: string; title: string };

/* Things sitting straight on the page, with no frames or captions, like the
   pretzels on their table. "objects" are cut-out product shots on a white
   ground (multiplied, so the ground disappears); "screens" are app frames,
   cropped to 4:3. Each names itself on hover or focus; touch screens, which
   have no hover, show the name under it instead. */
export function Shelf({ items, variant = "objects", label }: { items: ShelfItem[]; variant?: "objects" | "screens"; label: string }) {
  return (
    <ul className={`shelf shelf--${variant}`} aria-label={label}>
      {items.map(item => (
        <li key={item.href}>
          <Link href={item.href} className="shelf-item">
            <span className="shelf-media">
              <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 180px, (min-width: 640px) 25vw, 33vw" />
            </span>
            <span className="shelf-name">{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
