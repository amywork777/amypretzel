"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/* Reads/writes the active theme on <html data-theme="..."> and persists
   the user's choice in localStorage("theme"). The initial theme is set
   by an inline script in layout.tsx (see ThemeFlashScript) before
   hydration so there's no flash of the wrong palette on load. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // Sync local state with whatever the inline script applied.
  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme | null) ??
      "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore quota / private-mode errors */
    }
    setTheme(next);
  }

  // Render a placeholder before mount so the button doesn't flicker
  // its label between SSR and the resolved client value.
  const isDark = theme === "dark";
  const label = theme === null ? "Toggle theme" : isDark ? "Switch to light" : "Switch to dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="text-ink-muted hover:text-accent transition-colors inline-flex items-center"
    >
      {/* Sun = light is active, moon = dark is active. We render the
          icon for the *current* theme as a quick at-a-glance badge. */}
      {isDark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}

/* Inline script that picks the initial theme before React hydrates,
   so the page paints with the right colors instantly. Render this as
   <ThemeFlashScript /> inside <head>. */
export function ThemeFlashScript() {
  const code = `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(m?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
