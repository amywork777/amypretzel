import type { ButtonHTMLAttributes } from "react";

type Variant = "outline" | "pill";

/* The one button. outline: bordered box (panel actions). pill: round control,
   the same shape every link on the site takes. */
export function Button({ variant = "outline", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const cls = `ui-button ui-button--${variant}${className ? ` ${className}` : ""}`;
  return <button type="button" className={cls} {...props} />;
}
