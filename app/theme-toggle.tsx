"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/* Reads/writes the active theme on <html data-theme="..."> and persists
   the user's choice in localStorage("theme"). The initial theme is set
   by an inline script in layout.tsx (see ThemeFlashScript) before
   hydration so there's no flash of the wrong palette on load. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getTheme(): Theme {
  return (document.documentElement.getAttribute("data-theme") as Theme | null) ?? "light";
}

export function ThemeToggle() {
  // null on the server; the client reads whatever the inline script applied.
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore quota / private-mode errors */
    }
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
      className="ui-icon-button"
    >
      {/* Sun = light is active, moon = dark is active: the icon for the
          *current* theme. Both are drawn by hand like the pretzel and the
          group marks (Amy: only sketch icons, 2026-11-16): a wobbly sun
          with uneven rays, a crescent with a little star, and they boil
          through the shared #taste-boil filter. */}
      {isDark ? (
        <svg className="theme-sketch theme-sketch--moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "url(#taste-boil)" }}>
          <path d="M20.4 14.3c-1.3 3.5-4.6 6-8.5 5.9-4.9-.1-8.7-4.1-8.5-8.9.1-4 2.8-7.2 6.4-8.2-.9 1.4-1.4 3.1-1.3 4.9.2 4.6 4 8.1 8.6 7.9 1.3-.1 2.5-.4 3.6-1.1l.2-.1" />
          <path d="M17.6 3.4l.1 3M16.2 4.9h2.9" strokeWidth="1.2" />
        </svg>
      ) : (
        <svg className="theme-sketch theme-sketch--sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "url(#taste-boil)" }}>
          <path d="M12.3 7.7c2.4.1 4.2 2 4.1 4.4-.1 2.5-2 4.4-4.5 4.3-2.4-.1-4.3-2.1-4.2-4.5.1-2.3 2-4.2 4.5-4.1l.4.2" />
          <path d="M12 2.3v2.5M12.2 19.4v2.2M4.8 4.9l1.7 1.7M17.6 17.6l1.5 1.4M2.3 12.2h2.4M19.3 11.9h2.4M5 19.2l1.6-1.6M17.4 6.5l1.8-1.6" />
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
