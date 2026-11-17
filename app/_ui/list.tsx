import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type ListItem = {
  href: string;
  image: string;
  title: string;
  text?: string;
  /** One checkable fact (a patent, money raised, stars), set in ink after
      the soft line. Only facts with a public source. */
  proof?: string;
  year?: string;
  cutout?: boolean;
};

/* A plain list on hairlines: a picture, the title with one soft line under
   it (ending in its proof, in ink, when it has one), and the year on the right. Every picture is a 4:3 frame filled edge to
   edge: screenshots as they are, objects as trimmed cut-outs (see
   scripts/make-thumbs.mjs) multiplied onto the media tone so their white
   disappears. On a wide screen with a pointer, the hovered row's picture
   also shows large in the empty margin beside the list ("peek"). "small" is
   the quieter size used for earlier work. */
export function List({ items, label, small }: { items: ListItem[]; label: string; small?: boolean }) {
  return (
    <ul className={small ? "ui-list ui-list--small" : "ui-list"} aria-label={label}>
      {items.map(item => (
        <li key={item.href}>
          <Link href={item.href} className="ui-list-row">
            <span className={item.cutout ? "ui-list-thumb ui-cutout" : "ui-list-thumb"}>
              <Image src={item.image} alt="" fill sizes={small ? "64px" : "(max-width: 480px) 72px, 96px"} />
            </span>
            <span className="ui-list-text">
              <span className="ui-list-title">{item.title}</span>
              {item.text && <span className="ui-list-line">{item.text}{item.proof && <> <span className="ui-proof">{item.proof}</span></>}</span>}
            </span>
            {item.year && <span className="ui-list-year">{item.year}</span>}
            <span className={item.cutout ? "ui-list-peek ui-cutout" : "ui-list-peek"} aria-hidden="true">
              <Image src={item.image} alt="" fill sizes="320px" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* A kind of work, closed to one line so the homepage stays short: the
   group's name as a pill (the line's one control, filled while open), one
   sentence under it, and a strip of its first pictures. It opens in place
   to the full list. Native details/summary, so
   it works without script and find-in-page opens it; OpenOnHash opens it when
   a link jumps to it. */
export function Group({ id, title, note, items, children }: { id: string; title: string; note?: string; items: ListItem[]; children: ReactNode }) {
  return (
    <details id={id} className="ui-group">
      <summary>
        <span className="ui-group-name">
          <h2 className="ui-group-title">{title}</h2>
          {note && <span className="ui-group-note">{note}</span>}
        </span>
        <span className="ui-group-strip" aria-hidden="true">
          {items.slice(0, 5).map(item => (
            <span key={item.href} className={item.cutout ? "ui-group-pic ui-cutout" : "ui-group-pic"}>
              <Image src={item.image} alt="" fill sizes="48px" />
            </span>
          ))}
        </span>
      </summary>
      <div className="ui-group-body">{children}</div>
    </details>
  );
}

/* Earlier work folded under one small pill, filled while open, like the
   group names above it. Native details/summary: no script, keyboard and
   screen reader friendly. */
export function Earlier({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="ui-earlier">
      <summary><span className="ui-earlier-title">{title}</span></summary>
      {children}
    </details>
  );
}
