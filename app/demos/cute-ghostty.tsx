"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import "./cute-ghostty.css";

/* A small terminal in Cute Ghostty's clothes. The themes are the real theme
   files from the repo (themes/, values copied as they are), the greeting is
   cute-greeting.sh line for line (its ghost, its five messages, its two
   truecolor inks), and the cursor is the config's block. The shell is an
   imitation: a handful of commands that answer the way they would in a clone
   of the repo. Like the real config it follows light and dark until you pick
   a theme: "light:Cute Pink,dark:Cute Pastel Dreams". */

type Theme = { name: string; bg: string; fg: string; cursor: string; cursorText: string; selBg: string; selFg: string; palette: string[] };

// The six light themes share one palette and the four dark ones another.
const LIGHT = ["#6B4A5C", "#D6447E", "#3FA98A", "#C2872E", "#5E84CC", "#9B5FC0", "#3C97A4", "#C9A8B8", "#9B8290", "#FF6FA3", "#5FB89A", "#D89E3E", "#6E94DC", "#B07FD0", "#4CA7B4", "#5C4150"];
const DARK = ["#3A2A47", "#FF85B8", "#A8E6CF", "#FFF3B0", "#B8D4F0", "#C8A2F0", "#6DD5A8", "#F5EEF8", "#7A6690", "#FFB2D9", "#D4F5E4", "#FFD4A8", "#B8D4F0", "#E8D5FF", "#A8E6CF", "#FFFFFF"];

const THEMES: Theme[] = [
  { name: "Cute Pink", bg: "#FFF0F6", fg: "#6B4A5C", cursor: "#FF6FA3", cursorText: "#FFF0F6", selBg: "#FBD5E6", selFg: "#6B4A5C", palette: LIGHT },
  { name: "Cute Lavender", bg: "#F4EEFF", fg: "#534A66", cursor: "#9B5FC0", cursorText: "#F4EEFF", selBg: "#E3D6F7", selFg: "#534A66", palette: LIGHT },
  { name: "Cute Mint", bg: "#ECFBF4", fg: "#3E5B50", cursor: "#3FA98A", cursorText: "#ECFBF4", selBg: "#CFEEDF", selFg: "#3E5B50", palette: LIGHT },
  { name: "Cute Peach", bg: "#FFF4EA", fg: "#6B5340", cursor: "#E0894B", cursorText: "#FFF4EA", selBg: "#FCE0C8", selFg: "#6B5340", palette: LIGHT },
  { name: "Cute Lemon", bg: "#FFFCEC", fg: "#5F5A36", cursor: "#C7A12E", cursorText: "#FFFCEC", selBg: "#F4ECC2", selFg: "#5F5A36", palette: LIGHT },
  { name: "Cute Sky", bg: "#EEF6FF", fg: "#41506B", cursor: "#5E84CC", cursorText: "#EEF6FF", selBg: "#D4E4F7", selFg: "#41506B", palette: LIGHT },
  { name: "Cute Pastel Dreams", bg: "#1C1025", fg: "#F5EEF8", cursor: "#FFB2D9", cursorText: "#1C1025", selBg: "#3A2A47", selFg: "#F5EEF8", palette: DARK },
  { name: "Cute Midnight Pink", bg: "#241320", fg: "#FCEAF3", cursor: "#FFB2D9", cursorText: "#241320", selBg: "#43293A", selFg: "#FCEAF3", palette: DARK },
  { name: "Cute Midnight Lavender", bg: "#1E1830", fg: "#ECE6FA", cursor: "#C8A2F0", cursorText: "#1E1830", selBg: "#382E52", selFg: "#ECE6FA", palette: DARK },
  { name: "Cute Midnight Mint", bg: "#10211B", fg: "#E2F6EC", cursor: "#A8E6CF", cursorText: "#10211B", selBg: "#233F34", selFg: "#E2F6EC", palette: DARK },
];
const DARK_THEMES = new Set(THEMES.filter(t => t.palette === DARK).map(t => t.name));

// The pills: the config's light and dark pair first, then four more.
const PILLS = ["Cute Pink", "Cute Pastel Dreams", "Cute Lavender", "Cute Mint", "Cute Sky", "Cute Midnight Pink"];
const AUTO = { light: "Cute Pink", dark: "Cute Pastel Dreams" };

const themeOf = (name: string) => THEMES.find(t => t.name === name) ?? THEMES[0];
const short = (name: string) => name.replace(/^Cute /, "");

function vars(t: Theme): Record<string, string> {
  const v: Record<string, string> = { "--cg-bg": t.bg, "--cg-fg": t.fg, "--cg-cursor": t.cursor, "--cg-cursor-text": t.cursorText, "--cg-sel-bg": t.selBg, "--cg-sel-fg": t.selFg };
  t.palette.forEach((c, i) => { v[`--cg-p${i}`] = c; });
  return v;
}
const cssVars = (t: Theme) => Object.entries(vars(t)).map(([k, v]) => `${k}:${v}`).join(";");

/* Following the site's light or dark is done in CSS, so the first paint is
   already right before any script runs. */
const AUTO_CSS = `.cg-stage[data-auto]{${cssVars(themeOf(AUTO.light))}}html[data-theme="dark"] .cg-stage[data-auto]{${cssVars(themeOf(AUTO.dark))}}`;

// The page's own light or dark, so the pills can show which one is following it.
const subscribeSite = (onChange: () => void) => {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
};
const siteIsDark = () => document.documentElement.getAttribute("data-theme") === "dark";

/* ---- what's printed ---- */

// A colour is a palette slot (so it changes with the theme, like a real
// terminal) or a fixed truecolor ink, which is what the greeting uses.
type Seg = { t: string; c?: number | string; bg?: number };
type Line = { id: number; segs: Seg[]; ghost?: boolean };

const PINK = "#FF6FA3"; // cute-greeting.sh: \033[38;2;255;111;163m
const DIM = "#B07FD0"; //  cute-greeting.sh: \033[38;2;176;127;208m
const MESSAGES = [
  "your terminal is feeling extra cute today ♡",
  "pastel dreams loaded ₊✩‧₊˚",
  "go make something adorable ੨੎",
  "you + this terminal = iconic ✧",
  "stay cute, code cuter ⋆˚",
];
const GHOST = [
  String.raw`       .-~~~-.`,
  String.raw`      /       \ `.trimEnd(),
  String.raw`     |  o   o  |`,
  String.raw`     |    w    |`,
  String.raw`     |         |`,
  String.raw`      \^v^v^v^/`,
];

const DIR = "~/CuteGhostty";
const PROMPT = "CuteGhostty % ";

// A fresh clone, as `ls` shows it on a Mac: folders in blue, scripts in red.
const LS: Seg[] = [
  { t: "README.md" }, { t: "assets", c: 4 }, { t: "build.sh", c: 1 }, { t: "cute-ghostty.config" }, { t: "cute-greeting.sh", c: 1 },
  { t: "docs", c: 4 }, { t: "install.sh", c: 1 }, { t: "scripts", c: 4 }, { t: "site", c: 4 }, { t: "themes", c: 4 }, { t: "vercel.json" },
];

const CONFIG = `# Cute Ghostty — drop-in config for stock Ghostty.
# Install with ./install.sh, or include from your own config:
#   config-file = /absolute/path/to/cute-ghostty.config

# Cute icon: original Ghostty ghost, aluminum frame, medium-pink screen.
macos-icon = custom-style
macos-icon-frame = aluminum
macos-icon-screen-color = #FF6FA3

# Pastel themes — auto-switch with the system appearance.
# Swap either side for any "Cute *" theme in ./themes
# (Cute Pink, Cute Lavender, Cute Mint, Cute Peach, Cute Lemon, Cute Sky,
#  Cute Pastel Dreams, Cute Midnight Pink, Cute Midnight Lavender, Cute Midnight Mint).
theme = "light:Cute Pink,dark:Cute Pastel Dreams"

# Tasteful defaults (tweak freely).
cursor-style = block
mouse-hide-while-typing = true`;

const GREETING_SH = String.raw`#!/usr/bin/env bash
# Cute Ghostty launch greeting.
# Opt in by adding this to ~/.zshrc (or ~/.bashrc):
#   source /absolute/path/to/cute-greeting.sh
# Prints only for interactive shells. Works in both bash and zsh.

_cute_greeting() {
  case $- in *i*) ;; *) return 0 ;; esac

  local pink=$'\033[38;2;255;111;163m'
  local dim=$'\033[38;2;176;127;208m'
  local reset=$'\033[0m'

  # Positional params are 1-based in both bash and zsh.
  set -- \
    "your terminal is feeling extra cute today ♡" \
    "pastel dreams loaded ₊✩‧₊˚" \
    "go make something adorable ੨੎" \
    "you + this terminal = iconic ✧" \
    "stay cute, code cuter ⋆˚"
  local n=$(( $` + "{RANDOM:-0}" + String.raw` % $# + 1 ))
  local msg
  eval "msg=\$` + "{$n}" + String.raw`"

  printf '%s' "$pink"
  cat <<'GHOST'
` + GHOST.join("\n") + String.raw`
GHOST
  printf '%s%s%s\n' "$dim" "$msg" "$reset"
  printf '%s%s%s\n' "$dim" "₊✩‧₊˚ ੨੎ ˚₊✩‧₊" "$reset"
}

_cute_greeting
unset -f _cute_greeting 2>/dev/null || true`;

const themeFile = (t: Theme) => [
  ...t.palette.map((c, i) => `palette = ${i}=${c}`),
  `background = ${t.bg}`, `foreground = ${t.fg}`, `cursor-color = ${t.cursor}`, `cursor-text = ${t.cursorText}`,
  `selection-background = ${t.selBg}`, `selection-foreground = ${t.selFg}`,
].join("\n");

const COMMANDS: [string, string][] = [
  ["help", "this list"],
  ["ls", "files in the repo"],
  ["cat <file>", "print a file"],
  ["themes", "every Cute theme"],
  ["theme <name>", "switch, e.g. theme mint"],
  ["colors", "the 16 palette colours"],
  ["greeting", "run cute-greeting.sh again"],
  ["clear", "clear the screen"],
];

let nextId = 0;
const line = (...segs: Seg[]): Line => ({ id: nextId++, segs });
const plain = (text: string) => text.split("\n").map(t => line({ t }));

function greeting(n: number): Line[] {
  return [
    ...GHOST.map(t => ({ ...line({ t, c: PINK }), ghost: true })),
    line({ t: MESSAGES[n], c: DIM }),
    line({ t: "₊✩‧₊˚ ੨੎ ˚₊✩‧₊", c: DIM }),
  ];
}

/** Split a command line the way a shell would, near enough: quotes and backslash-escaped spaces. */
function words(input: string): string[] {
  const out: string[] = [];
  let cur = "", quote = "", any = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) { if (ch === quote) quote = ""; else cur += ch; continue; }
    if (ch === "'" || ch === '"') { quote = ch; any = true; continue; }
    if (ch === "\\" && i + 1 < input.length) { cur += input[++i]; any = true; continue; }
    if (/\s/.test(ch)) { if (cur || any) out.push(cur); cur = ""; any = false; continue; }
    cur += ch; any = true;
  }
  if (cur || any) out.push(cur);
  return out;
}

function findTheme(query: string): Theme | undefined {
  const q = query.toLowerCase().replace(/^themes\//, "").replace(/^cute\s+/, "").replace(/[-_]/g, " ").trim();
  return THEMES.find(t => short(t.name).toLowerCase() === q);
}

export default function CuteGhostty() {
  const [picked, setPicked] = useState<string | null>(null); // null follows the site's light or dark
  const dark = useSyncExternalStore(subscribeSite, siteIsDark, () => false);
  const [lines, setLines] = useState<Line[]>(() => greeting(0));
  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const history = useRef<string[]>([]);
  const historyAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  const current = themeOf(picked ?? (dark ? AUTO.dark : AUTO.light));

  // The real script picks one of its five messages at random each time.
  useEffect(() => {
    const n = Math.floor(Math.random() * MESSAGES.length);
    if (n) setLines(greeting(n)); // eslint-disable-line react-hooks/set-state-in-effect -- once, after hydration
  }, []);

  // Keep the newest line in view.
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, value]);

  function run(input: string): Line[] | "clear" {
    const [cmd, ...args] = words(input);
    if (!cmd) return [];
    switch (cmd) {
      case "help":
        return [
          line({ t: "A few commands work here:" }),
          ...COMMANDS.map(([c, d]) => line({ t: "  " + c.padEnd(14), c: 5 }, { t: d })),
          line({ t: "Try cat cute-ghostty.config" }),
        ];
      case "ls": {
        const dir = args.find(a => !a.startsWith("-"));
        if (!dir || dir === "." || dir === "./") return [line(...LS.flatMap((s, i) => (i ? [{ t: "  " }, s] : [s])))];
        if (dir.replace(/\/$/, "") === "themes") return THEMES.map(t => line({ t: t.name }));
        if (LS.some(s => s.t === dir.replace(/\/$/, ""))) return [line({ t: `ls: ${dir}: not in this demo, it's on GitHub` })];
        return [line({ t: `ls: ${dir}: No such file or directory` })];
      }
      case "cat": {
        if (!args.length) return [line({ t: "usage: cat <file>   (try cat cute-ghostty.config)" })];
        return args.flatMap(f => {
          const name = f.replace(/^\.\//, "");
          if (name === "cute-ghostty.config") return plain(CONFIG);
          if (name === "cute-greeting.sh") return plain(GREETING_SH);
          if (name.startsWith("themes/")) {
            const t = findTheme(name);
            return t ? plain(themeFile(t)) : [line({ t: `cat: ${f}: No such file or directory` })];
          }
          if (LS.some(s => s.t === name)) return [line({ t: `cat: ${f}: not in this demo, it's on GitHub` })];
          return [line({ t: `cat: ${f}: No such file or directory` })];
        });
      }
      case "themes":
        return THEMES.map(t => line(
          { t: t.name === current.name ? "* " : "  ", c: 5 },
          { t: t.name.padEnd(24) },
          { t: DARK_THEMES.has(t.name) ? "dark" : "light", c: 8 },
        ));
      case "theme": {
        if (!args.length) return [line({ t: picked ? `theme = "${picked}"` : `theme = "light:${AUTO.light},dark:${AUTO.dark}"` })];
        const t = findTheme(args.join(" "));
        if (!t) return [line({ t: `theme: no theme called "${args.join(" ")}". Try themes.` })];
        setPicked(t.name);
        return [];
      }
      case "colors":
      case "colours":
        return [0, 8].map(start => line(...Array.from({ length: 8 }, (_, i) => ({ t: "   ", bg: start + i }))));
      case "greeting":
        return greeting(Math.floor(Math.random() * MESSAGES.length));
      case "source":
      case ".":
      case "bash":
      case "zsh":
      case "sh":
        if (args[0]?.replace(/^\.\//, "") === "cute-greeting.sh") return greeting(Math.floor(Math.random() * MESSAGES.length));
        return [line({ t: `${cmd}: only cute-greeting.sh runs in this demo` })];
      case "./cute-greeting.sh":
        return greeting(Math.floor(Math.random() * MESSAGES.length));
      case "./install.sh":
      case "./build.sh":
        return [line({ t: `${cmd.slice(2)}: this one sets up Ghostty on your Mac, so it doesn't run in a browser` })];
      case "clear":
        return "clear";
      case "pwd":
        return [line({ t: DIR.replace("~", "/Users/you") })];
      case "whoami":
        return [line({ t: "you" })];
      case "echo":
        return [line({ t: args.join(" ") })];
      case "cd":
        return [line({ t: "cd: this demo stays in CuteGhostty" })];
      case "ghostty":
        return [line({ t: "you're in a picture of it. The real one is at ghostty.org" })];
      default:
        return [line({ t: `zsh: command not found: ${cmd}` })];
    }
  }

  function submit() {
    const input = value;
    const echo = line({ t: PROMPT }, { t: input });
    const out = run(input);
    if (input.trim()) { history.current.push(input); }
    historyAt.current = history.current.length;
    setLines(prev => (out === "clear" ? [] : [...prev, echo, ...out].slice(-400)));
    setValue("");
    setCaret(0);
  }

  function complete() {
    const ws = value.split(" ");
    const last = ws[ws.length - 1];
    let options: string[];
    if (ws.length === 1) options = [...COMMANDS.map(([c]) => c.split(" ")[0]), "pwd", "echo", "source"];
    else if (ws[0] === "theme") options = THEMES.map(t => short(t.name).toLowerCase().replace(/ /g, "-"));
    else options = [...LS.map(s => s.t), ...THEMES.map(t => `themes/${t.name.replace(/ /g, "\\ ")}`)];
    const hits = options.filter(o => o.startsWith(last));
    if (hits.length === 1) {
      const next = [...ws.slice(0, -1), hits[0]].join(" ") + (ws.length === 1 ? " " : "");
      setValue(next);
      setCaret(next.length);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); submit(); return; }
    if (e.key === "Tab") { e.preventDefault(); complete(); return; }
    if (e.ctrlKey && (e.key === "l" || e.key === "L")) { e.preventDefault(); setLines([]); return; }
    if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      setLines(prev => [...prev, line({ t: PROMPT }, { t: value + "^C" })]);
      setValue("");
      setCaret(0);
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      historyAt.current = Math.max(0, Math.min(h.length, historyAt.current + (e.key === "ArrowUp" ? -1 : 1)));
      const next = h[historyAt.current] ?? "";
      setValue(next);
      setCaret(next.length);
    }
  }

  const syncCaret = () => { const el = inputRef.current; if (el) setCaret(el.selectionStart ?? el.value.length); };

  const focus = () => {
    // Leave a text selection alone, so output can still be copied.
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus({ preventScroll: true });
  };

  const colour = (c: Seg["c"]) => (c === undefined ? undefined : typeof c === "number" ? `var(--cg-p${c})` : c);
  const before = value.slice(0, caret), at = value.slice(caret, caret + 1), after = value.slice(caret + 1);
  const ghostEnd = lines.findIndex((l, i) => l.ghost && !lines[i + 1]?.ghost);

  return (
    <figure className="ui-try">
      <style>{AUTO_CSS}</style>
      <div
        className="ui-media ui-try-stage cg-stage"
        data-auto={picked ? undefined : ""}
        style={(picked ? vars(current) : undefined) as CSSProperties | undefined}
        onClick={focus}
      >
        <div ref={screenRef} className="cg-screen" role="log" aria-label={`Terminal, ${current.name} theme`}>
          {lines.map((l, i) => (
            <div
              key={l.id}
              className="cg-line"
              // The ghost is drawn in characters; a screen reader hears what it is instead.
              aria-hidden={l.ghost && i !== ghostEnd ? true : undefined}
            >
              {l.ghost && i === ghostEnd && <span className="cg-sr">A pink ghost made of characters.</span>}
              {l.segs.map((s, j) => (
                <span key={j} style={s.c !== undefined || s.bg !== undefined ? { color: colour(s.c), background: colour(s.bg) } : undefined} aria-hidden={l.ghost || undefined}>{s.t}</span>
              ))}
            </div>
          ))}
          <div className="cg-line" aria-hidden="true">
            <span>{PROMPT}</span>
            <span>{before}</span>
            <span key={value + caret} className="cg-cursor">{at || " "}</span>
            <span>{after}</span>
          </div>
        </div>
        <input
          ref={inputRef}
          className="cg-input"
          type="text"
          aria-label="Type a command, then press Enter. Try help."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          value={value}
          onChange={e => { setValue(e.target.value); setCaret(e.target.selectionStart ?? e.target.value.length); }}
          onKeyDown={onKeyDown}
          onKeyUp={syncCaret}
          onSelect={syncCaret}
        />
      </div>
      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Theme">
          {PILLS.map(name => (
            <button key={name} type="button" className="ui-try-pill" aria-pressed={current.name === name} onClick={() => setPicked(name)}>
              {short(name)}
            </button>
          ))}
        </div>
      </div>
      <figcaption className="ui-try-caption">Try it: click the terminal and type help, or pick a theme. The themes and greeting are the real files; the shell is a small imitation.</figcaption>
    </figure>
  );
}
