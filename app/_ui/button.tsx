import type { ButtonHTMLAttributes } from "react";

type Variant = "outline" | "pill" | "text";

/* The one button. outline: bordered box (panel actions). pill: floating round
   control. text: looks like a label, for low-emphasis actions. */
export function Button({ variant = "outline", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const cls = `ui-button ui-button--${variant}${className ? ` ${className}` : ""}`;
  return <button type="button" className={cls} {...props} />;
}
