"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import "./voice-input.css";

/* A small, real version of voice input: hold the pill (or Space), speak, and
   the words stream into the prompt as they're recognised. It uses the
   browser's own speech recognition (SpeechRecognition, webkit-prefixed in
   Chrome and Safari), which in Chrome sends the audio to Google. That API
   needs to be told the language, so there are language pills; the real
   feature works the language out itself.

   The microphone is asked for only on the first press. While held, a small
   level meter reads the mic through an AnalyserNode, then everything is
   stopped and released on letting go. */

type Lang = { code: string; label: string; name: string; example: string; spaced: boolean };

const LANGS: Lang[] = [
  { code: "en-US", label: "English", name: "English", example: "Make the upper a soft red knit and keep the sole white", spaced: true },
  { code: "zh-CN", label: "中文", name: "Chinese", example: "把鞋面改成柔和的红色针织，鞋底保持白色", spaced: false },
  { code: "es-ES", label: "Español", name: "Spanish", example: "Haz la parte de arriba de punto rojo suave y deja la suela blanca", spaced: true },
  { code: "ja-JP", label: "日本語", name: "Japanese", example: "アッパーを柔らかい赤のニットにして、ソールは白のままにして", spaced: false },
  { code: "fr-FR", label: "Français", name: "French", example: "Fais la tige en maille rouge douce et garde la semelle blanche", spaced: true },
  { code: "hi-IN", label: "हिन्दी", name: "Hindi", example: "ऊपरी हिस्से को नरम लाल बुनाई का बनाओ और सोल सफ़ेद रखो", spaced: true },
];

// The bits of the Web Speech API used here; TypeScript's DOM types don't
// ship it.
type Alternative = { transcript: string };
type Result = { isFinal: boolean; 0: Alternative; length: number };
type ResultEvent = { resultIndex: number; results: { length: number; [i: number]: Result } };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: ResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

const recognitionCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const BARS = 5;
const noop = () => () => {};

type Status =
  | { kind: "idle" }
  | { kind: "asking" }
  | { kind: "listening" }
  | { kind: "message"; text: string };

export default function VoiceInput() {
  const [lang, setLang] = useState<Lang>(LANGS[0]);
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Known only in the browser; the server and first paint assume it works.
  const supported = useSyncExternalStore(noop, () => recognitionCtor() !== null, () => true);
  const [heard, setHeard] = useState("");
  const rec = useRef<Recognition | null>(null);
  const held = useRef(false);
  const base = useRef("");
  const session = useRef({ final: "", interim: "" });
  const audio = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);
  const bars = useRef<HTMLSpanElement[]>([]);
  const lastKeyUp = useRef(0);
  const hintId = useId();

  const stopLevel = () => {
    const a = audio.current;
    if (!a) return;
    cancelAnimationFrame(a.raf);
    a.stream.getTracks().forEach(t => t.stop());
    a.ctx.close().catch(() => {});
    audio.current = null;
    bars.current.forEach(b => b && (b.style.transform = ""));
  };

  useEffect(() => {
    const r = rec, a = audio;
    return () => {
      r.current?.abort();
      if (a.current) { cancelAnimationFrame(a.current.raf); a.current.stream.getTracks().forEach(t => t.stop()); a.current.ctx.close().catch(() => {}); }
    };
  }, []);

  const join = (a: string, b: string) => {
    if (!a) return b.trim();
    if (!b.trim()) return a;
    return lang.spaced ? `${a.trimEnd()} ${b.trim()}` : a + b.trim();
  };

  // A calm level meter: RMS of the waveform, eased, spread over five bars
  // with the middle one tallest.
  const startLevel = (stream: MediaStream) => {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) { stream.getTracks().forEach(t => t.stop()); return; }
    const ctx = new AC();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let level = 0;
    const shape = [0.55, 0.8, 1, 0.8, 0.55];
    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      const rms = Math.min(1, Math.sqrt(sum / buf.length) * 5);
      level += (rms - level) * (rms > level ? 0.5 : 0.12);
      const shown = reduce ? (level > 0.08 ? 0.6 : 0.2) : level;
      bars.current.forEach((b, i) => { if (b) b.style.transform = `scaleY(${0.2 + 0.8 * shown * shape[i]})`; });
      if (audio.current) audio.current.raf = requestAnimationFrame(tick);
    };
    audio.current = { stream, ctx, raf: requestAnimationFrame(tick) };
  };

  const messageFor = (error: string) => {
    switch (error) {
      case "not-allowed":
      case "service-not-allowed":
        return "The microphone is blocked for this site. Allow it in the address bar, then hold again.";
      case "no-speech": return "Didn't hear anything. Hold the button and speak.";
      case "audio-capture": return "No microphone found.";
      case "network": return "This browser's speech recognition needs a connection and didn't get one.";
      case "language-not-supported": return `This browser can't recognise ${lang.name}.`;
      default: return "Speech recognition stopped. Try again.";
    }
  };

  const start = async () => {
    const Ctor = recognitionCtor();
    if (!Ctor || held.current) return;
    held.current = true;
    base.current = text;
    session.current = { final: "", interim: "" };
    setInterim("");
    setHeard("");

    // Ask for the mic first: it is what shows the permission prompt, and it
    // feeds the level meter. If the prompt was showing, the press is over by
    // the time it's answered, so the next press is the one that records.
    let permissionWasAsked = false;
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const state = await navigator.permissions?.query({ name: "microphone" as PermissionName }).then(p => p.state).catch(() => null);
        if (state !== "granted") { permissionWasAsked = true; setStatus({ kind: "asking" }); }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!held.current) {
          stream.getTracks().forEach(t => t.stop());
          setStatus(permissionWasAsked ? { kind: "message", text: "Microphone on. Hold to talk." } : { kind: "idle" });
          return;
        }
        startLevel(stream);
      } catch (err) {
        held.current = false;
        const name = (err as { name?: string }).name;
        setStatus({ kind: "message", text: name === "NotFoundError" ? "No microphone found." : messageFor("not-allowed") });
        return;
      }
    }

    const r = new Ctor();
    r.lang = lang.code;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = e => {
      let final = "", pending = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final = join(final, t); else pending = join(pending, t);
      }
      session.current = { final, interim: pending };
      setText(join(base.current, final));
      setInterim(pending);
    };
    r.onerror = e => {
      if (e.error === "aborted") return;
      setStatus({ kind: "message", text: messageFor(e.error) });
    };
    r.onend = () => {
      // Keep what was still being worked out when it stopped.
      const { final, interim: pending } = session.current;
      const said = join(final, pending);
      if (said) {
        setText(join(base.current, said));
        setHeard(`Heard: ${said}`);
      }
      setInterim("");
      rec.current = null;
      stopLevel();
      setStatus(s => (s.kind === "message" ? s : { kind: "idle" }));
    };
    rec.current = r;
    setStatus({ kind: "listening" });
    try {
      r.start();
    } catch {
      setStatus({ kind: "message", text: "Speech recognition didn't start. Try again." });
      stopLevel();
      held.current = false;
      return;
    }
    if (!held.current) r.stop();
  };

  const stop = () => {
    if (!held.current) return;
    held.current = false;
    rec.current?.stop();
    stopLevel();
  };

  const toggle = () => (held.current ? stop() : start());

  const pickLang = (l: Lang) => {
    if (held.current) stop();
    setLang(l);
    if (status.kind === "message") setStatus({ kind: "idle" });
  };

  const clear = () => {
    setText("");
    setInterim("");
    setHeard("");
    if (status.kind === "message") setStatus({ kind: "idle" });
  };

  const listening = status.kind === "listening";
  const empty = !text && !interim;
  const footer = !supported
    ? "This browser has no speech recognition, so the mic is off here. Try Chrome, Edge or Safari."
    : status.kind === "asking" ? "Allow the microphone to talk."
    : status.kind === "listening" ? `Listening in ${lang.name}`
    : status.kind === "message" ? status.text
    : "Hold to talk";

  return (
    <figure className="ui-try vi">
      <div className="ui-media ui-try-stage vi-stage">
        <div className="vi-field" data-listening={listening || undefined}>
          <p className="vi-text" lang={lang.code} aria-label="Prompt" data-empty={empty || undefined}>
            {empty ? lang.example : (
              <>
                {text}
                {interim && <span className="vi-interim">{text ? (lang.spaced ? " " : "") : ""}{interim}</span>}
              </>
            )}
          </p>
          <div className="vi-foot">
            <span className="vi-level" aria-hidden="true" data-on={listening || undefined} hidden={!supported}>
              {Array.from({ length: BARS }, (_, i) => (
                <span key={i} ref={el => { if (el) bars.current[i] = el; }} />
              ))}
            </span>
            <span className="vi-status">{footer}</span>
          </div>
        </div>
      </div>

      <div className="ui-try-controls">
        <div className="ui-try-row" role="group" aria-label="Language">
          {LANGS.map(l => (
            <button key={l.code} type="button" className="ui-try-pill" lang={l.code} aria-pressed={lang.code === l.code} aria-label={l.name} onClick={() => pickLang(l)}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="ui-try-row">
          <button type="button" className="ui-try-reset vi-clear" onClick={clear} disabled={!text}>Clear</button>
          <button
            type="button"
            className="ui-try-pill vi-hold"
            aria-pressed={listening}
            aria-describedby={hintId}
            disabled={!supported}
            onPointerDown={e => {
              if (e.button !== 0) return;
              e.preventDefault();
              e.currentTarget.focus();
              e.currentTarget.setPointerCapture(e.pointerId);
              start();
            }}
            onPointerUp={stop}
            onPointerCancel={stop}
            onLostPointerCapture={stop}
            onKeyDown={e => {
              if (e.key !== " ") return;
              e.preventDefault();
              if (!e.repeat) start();
            }}
            onKeyUp={e => {
              if (e.key !== " ") return;
              e.preventDefault();
              lastKeyUp.current = performance.now();
              stop();
            }}
            // A click with no pointer behind it (Enter, a screen reader) starts
            // and stops instead of holding.
            onClick={e => { if (e.detail === 0 && performance.now() - lastKeyUp.current > 300) toggle(); }}
            onContextMenu={e => e.preventDefault()}
          >
            {listening ? "Listening" : "Hold to talk"}
          </button>
        </div>
      </div>
      <p id={hintId} className="sr-only">Hold Space to talk, or press Enter to start and again to stop.</p>
      <p className="sr-only" aria-live="polite">{heard || (status.kind === "message" ? status.text : "")}</p>

      <figcaption className="ui-try-caption">
        Try it: pick a language, hold the button (or Space) and say a change. It uses your browser&rsquo;s own speech recognition, which in Chrome goes to Google; the real feature works out the language itself.
      </figcaption>
    </figure>
  );
}
