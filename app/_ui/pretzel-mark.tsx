/* Amy's pretzel as a sketch: one rope looped into two round lobes, crossing
   in an X, the two ends resting on the belly. Drawn in ink (currentColor) and
   boiling through the taste kit's filter (#taste-boil, mounted once in the
   root layout). Same hand as the homepage group marks. Amy asked for only
   sketch icons, no coloured things, on 2026-11-16.

   Two forms:
   - PretzelRope (header, project bar): the rope with thickness. Amy picked
     it from four 3D-ish options the same day (rope, shaded and salted, CAD
     sweep, on the table). It is drawn as an ink tube with the page's paper
     inside, painted in three layers so each crossing reads over and under:
     the whole rope, then the right end over the belly, then the left end
     over the belly and over the twist. The ends' paths are the same curve,
     sampled, so the layers join without a seam.
   - PretzelMark (the tiny footer secret): the single line, which reads
     better under 20px. The favicon (public/icon.svg) is the same line. */

const CENTRE = "M26 70.5C33.5 61 44 51.5 50 44.5 56 37.5 56.5 30 60 22.5 64.5 12.5 73.5 8 82 10c11 2.6 15.5 15 11.5 27-4 12.5-17.5 23-31.5 29-8 3.4-16 3.4-24 0C24.5 60 11 49.5 7 37 3 25 7.5 12.6 18 10c8.5-2 17.5 2.5 22 12.5 3 6.6 3.6 11.5 6.3 16.4C48.6 43.1 51 45.4 53.7 48.6c5.6 6.6 12.6 13.4 20.3 21.9";
// The right end from just past the twist to its tip, and the left end from its tip to just past the twist.
const RIGHT_END = "M59.38 54.93L59.86 55.44L60.33 55.95L60.81 56.46L61.29 56.97L61.78 57.48L62.26 57.99L62.74 58.50L63.22 59.00L63.70 59.51L64.19 60.02L64.67 60.53L65.15 61.03L65.64 61.54L66.12 62.05L66.60 62.55L67.08 63.06L67.56 63.57L68.04 64.08L68.52 64.59L69.00 65.10L69.48 65.61L69.96 66.12L70.44 66.63L70.92 67.14L71.39 67.66L71.87 68.17L72.34 68.68L72.82 69.20L73.29 69.72L73.76 70.23L74.00 70.50";
const LEFT_END = "M26.00 70.50L26.44 69.95L26.88 69.41L27.32 68.87L27.77 68.33L28.22 67.79L28.67 67.26L29.12 66.73L29.58 66.20L30.04 65.67L30.51 65.15L30.97 64.62L31.44 64.10L31.91 63.59L32.39 63.07L32.86 62.55L33.34 62.04L33.81 61.53L34.29 61.02L34.77 60.51L35.25 60.00L35.74 59.49L36.22 58.99L36.71 58.48L37.19 57.98L37.68 57.48L38.16 56.97L38.65 56.47L39.14 55.97L39.63 55.47L40.12 54.97L40.61 54.47L41.10 53.96L41.58 53.46L42.07 52.96L42.56 52.46L43.05 51.96L43.54 51.46L44.03 50.96L44.51 50.45L45.00 49.95L45.48 49.44L45.96 48.93L46.44 48.43L46.92 47.92L47.40 47.40L47.87 46.89L48.35 46.37L48.82 45.85L49.28 45.33L49.74 44.80L50.20 44.27L50.64 43.73L51.07 43.17L51.48 42.61L51.88 42.04L52.27 41.45L52.64 40.86L53.00 40.26L53.34 39.65L53.67 39.03L53.99 38.41L54.29 37.77L54.58 37.14L54.86 36.49L55.12 35.85L55.38 35.20L55.63 34.54L55.87 33.88L56.10 33.22L56.33 32.56L56.51 32.02";
const ROPE = 11;

/** The rope pretzel. `px` is the size it is shown at, so the outline stays about 1px whatever the size. */
export function PretzelRope({ px, line = 1.1 }: { px: number; line?: number }) {
  const l = line / (px / 110);
  const layers: [string, "round" | "butt"][] = [[CENTRE, "round"], [RIGHT_END, "butt"], [LEFT_END, "butt"]];
  return (
    <svg viewBox="-5 -1 110 82" fill="none" strokeLinejoin="round" aria-hidden="true" style={{ filter: "url(#taste-boil)" }}>
      {layers.map(([d, cap], i) => (
        <g key={i} strokeLinecap={cap}>
          <path d={d} stroke="currentColor" strokeWidth={ROPE + 2 * l} />
          <path d={d} stroke="var(--color-paper)" strokeWidth={ROPE} />
        </g>
      ))}
    </svg>
  );
}

/** The single-line pretzel, for tiny places. */
export function PretzelMark({ className, weight = 2.2 }: { className?: string; weight?: number }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ filter: "url(#taste-boil)" }}>
      <path vectorEffect="non-scaling-stroke" d="M26 70.5C33.5 61 44 51.5 50 44.5 56 37.5 56.5 30 60 22.5 64.5 12.5 73.5 8 82 10c11 2.6 15.5 15 11.5 27-4 12.5-17.5 23-31.5 29-8 3.4-16 3.4-24 0C24.5 60 11 49.5 7 37 3 25 7.5 12.6 18 10c8.5-2 17.5 2.5 22 12.5 3 6.6 3.6 11.5 6.3 16.4" />
      <path vectorEffect="non-scaling-stroke" d="M53.7 48.6c5.6 6.6 12.6 13.4 20.3 21.9" />
    </svg>
  );
}
