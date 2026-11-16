"use client";

import { useSyncExternalStore } from "react";

/* Two versions of the site share one build. "work" is the default and what a
   recruiter lands on; "personal" brings back the pretzel table, the hidden
   pretzel, the crafts and the lowercase sign-off. The mode lives on
   <html data-mode>, set before paint by ModeScript, and CSS shows or hides
   .personal-only and .work-only. ?mode=personal in a link opens that version. */
export type Mode = "work" | "personal";
const KEY = "mode";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => observer.disconnect();
}

export function getMode(): Mode {
  return document.documentElement.getAttribute("data-mode") === "personal" ? "personal" : "work";
}

function setMode(next: Mode) {
  document.documentElement.setAttribute("data-mode", next);
  try { localStorage.setItem(KEY, next); } catch { /* private mode: the choice lasts this page */ }
  const url = new URL(window.location.href);
  if (url.searchParams.has("mode")) {
    url.searchParams.set("mode", next);
    history.replaceState(history.state, "", url);
  }
}

export function ModeSwitch() {
  // null on the server; the client reads whatever ModeScript applied.
  const mode = useSyncExternalStore<Mode | null>(subscribe, getMode, () => null);
  return (
    <div className="mode-switch" role="group" aria-label="Version of the site">
      {(["work", "personal"] as const).map(m => (
        <button key={m} type="button" data-value={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
          {m === "work" ? "Work" : "Personal"}
        </button>
      ))}
    </div>
  );
}

/* Picks the mode before React hydrates: the URL wins, then the visitor's last
   choice, then work. Render inside <head>. */
export function ModeScript() {
  const code = `(function(){try{var q=new URLSearchParams(location.search).get('mode');var m=q==='personal'||q==='work'?q:null;if(m){localStorage.setItem('${KEY}',m);}else{m=localStorage.getItem('${KEY}');}document.documentElement.setAttribute('data-mode',m==='personal'?'personal':'work');}catch(e){document.documentElement.setAttribute('data-mode','work');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
