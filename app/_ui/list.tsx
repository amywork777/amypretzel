import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type ListItem = { href: string; image: string; title: string; text?: string; year?: string; screen?: boolean };

/* A plain list on hairlines: a small picture, the title with one soft line
   under it, and the year on the right. Objects sit on the light media tone
   (multiplied, so their white ground disappears); screens fill their frame.
   "small" is the quieter size used for earlier work. */
export function List({ items, label, small }: { items: ListItem[]; label: string; small?: boolean }) {
  return (
    <ul className={small ? "ui-list ui-list--small" : "ui-list"} aria-label={label}>
      {items.map(item => (
        <li key={item.href}>
          <Link href={item.href} className="ui-list-row">
            <span className={item.screen ? "ui-list-thumb ui-list-thumb--screen" : "ui-list-thumb"}>
              <Image src={item.image} alt="" fill sizes="64px" />
            </span>
            <span className="ui-list-text">
              <span className="ui-list-title">{item.title}</span>
              {item.text && <span className="ui-list-line">{item.text}</span>}
            </span>
            {item.year && <span className="ui-list-year">{item.year}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* Earlier work folded under one line, so less sits on the page. Native
   details/summary: no script, keyboard and screen reader friendly. */
export function Earlier({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <details className="ui-earlier">
      <summary>{title} <span className="ui-earlier-count">{count}</span></summary>
      {children}
    </details>
  );
}
