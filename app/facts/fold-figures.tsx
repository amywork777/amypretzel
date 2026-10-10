// Cross-sections of thick panels folding, for the thickness accommodation fact.
// Every folded state is computed by rotating the flat panels about their real
// hinge points, so the drawings are geometrically exact rather than sketched.

type Pt = [number, number];
type Shape = { points: Pt[]; kind: "panel" | "ghost" };
type Line = { points: Pt[]; arc?: { r: number; sweep: 0 | 1 } };
type Label = { at: Pt; text: string };
type State = { caption: string; shapes: Shape[]; lines?: Line[]; hinges?: Pt[]; labels?: Label[] };

export type FoldFigureKind = "wrap" | "tapered" | "offset" | "double" | "membrane";

const L = 56; // panel length
const T = 14; // panel thickness
const GAP = 30; // space between the two states
const PAD = 14;
const SCALE = 1.15; // every figure draws at the same scale, so labels match across them

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
// Screen coordinates (y down): a positive quarter turn swings +x up to -y.
const turn = (points: Pt[], [cx, cy]: Pt, quarters: number): Pt[] => points.map(([x, y]) => {
  let dx = x - cx, dy = y - cy;
  for (let q = 0; q < ((quarters % 4) + 4) % 4; q++) [dx, dy] = [dy, -dx];
  return [cx + dx, cy + dy];
});
const panel = (points: Pt[]): Shape => ({ points, kind: "panel" });

// A fabric skin under two panels folds into a half circle of radius t round the
// outside, so it needs about πt of slack between them.
const SLACK = Math.PI * T;

const FIGURES: Record<FoldFigureKind, State[]> = {
  wrap: [
    {
      caption: "paper",
      shapes: [],
      lines: [{ points: [[0, 0], [L, 0]] }],
      hinges: [[0, 0]],
    },
    {
      caption: "thick panels",
      shapes: [panel(rect(0, 0, L, T)), panel(rect(0, -T, L, T))],
      lines: [{ points: [[0, T], [0, -T]], arc: { r: T, sweep: 1 } }],
      hinges: [[0, 0]],
      labels: [{ at: [-T - 20, 4], text: "≈ πt" }, { at: [L + 8, T / 2 + 4], text: "t" }],
    },
  ],
  tapered: [
    {
      caption: "flat",
      shapes: [panel([[0, 0], [L - T, 0], [L, T], [0, T]]), panel([[L, T], [L + T, 0], [2 * L, 0], [2 * L, T]])],
      hinges: [[L, T]],
    },
    {
      caption: "folded",
      shapes: [panel([[0, 0], [L - T, 0], [L, T], [0, T]]), panel(turn([[L, T], [L + T, 0], [2 * L, 0], [2 * L, T]], [L, T], 1))],
      hinges: [[L, T]],
    },
  ],
  offset: [
    {
      caption: "flat",
      shapes: [panel(rect(0, 0, L, T)), panel(rect(L, 0, L, T))],
      hinges: [[L, 0]],
    },
    {
      caption: "folded",
      shapes: [panel(rect(0, 0, L, T)), panel(turn(rect(L, 0, L, T), [L, 0], 2))],
      hinges: [[L, 0]],
    },
  ],
  double: (() => {
    const W = 2 * T; // the strip is as wide as what it has to wrap around
    const strip = rect(L, 0, W, T);
    const far = rect(L + W, 0, L, T);
    const h1: Pt = [L, 0], h2: Pt = [L + W, 0];
    const h2Folded = turn([h2], h1, 1)[0];
    return [
      {
        caption: "flat",
        shapes: [panel(rect(0, 0, L, T)), panel(strip), panel(far)],
        hinges: [h1, h2],
      },
      {
        caption: "folded",
        shapes: [
          panel(rect(0, 0, L, T)),
          panel(turn(strip, h1, 1)),
          panel(turn(turn(far, h1, 1), h2Folded, 1)),
          { points: rect(0, -W, L, W), kind: "ghost" },
        ],
        hinges: [h1, h2Folded],
      },
    ];
  })(),
  membrane: [
    {
      caption: "flat",
      shapes: [panel(rect(0, 0, L, T)), panel(rect(L + SLACK, 0, L, T))],
      lines: [{ points: [[0, T], [2 * L + SLACK, T]] }],
      labels: [{ at: [L + SLACK / 2, T + 14], text: "πt" }],
    },
    {
      caption: "folded",
      shapes: [panel(rect(0, 0, L, T)), panel(rect(0, -T, L, T))],
      lines: [
        { points: [[0, T], [L, T]] },
        { points: [[L, T], [L, -T]], arc: { r: T, sweep: 0 } },
        { points: [[L, -T], [0, -T]] },
      ],
    },
  ],
};

function bounds(state: State) {
  const pts = [...state.shapes.flatMap(s => s.points), ...(state.lines ?? []).flatMap(l => l.points)];
  // Arcs bulge out past their end points by their radius.
  for (const l of state.lines ?? []) if (l.arc) {
    const [[x], [, y1]] = l.points;
    pts.push([x + (l.arc.sweep ? -l.arc.r : l.arc.r), y1]);
  }
  for (const lb of state.labels ?? []) pts.push([lb.at[0] - 14, lb.at[1] - 10], [lb.at[0] + 14, lb.at[1]]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

const path = (points: Pt[]) => `M${points.map(p => p.join(" ")).join("L")}Z`;

export function FoldFigure({ kind, label, scale = SCALE }: { kind: FoldFigureKind; label: string; scale?: number }) {
  const states = FIGURES[kind];
  const boxes = states.map(bounds);
  const height = Math.max(...boxes.map(b => b.h));
  const width = boxes.reduce((sum, b) => sum + b.w, 0) + GAP * (states.length - 1);
  // Each state's left edge: laid out in a row, GAP apart.
  const lefts = boxes.map((_, i) => PAD + boxes.slice(0, i).reduce((sum, b) => sum + b.w + GAP, 0));
  const w = width + PAD * 2, h = height + PAD * 2 + 18;
  return (
    <div className="fold-figure">
      <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
        {states.map((state, i) => {
          const b = boxes[i];
          // Sit every state on the same baseline.
          const dx = lefts[i] - b.x, dy = PAD + height - (b.y + b.h);
          return (
            <g key={state.caption}>
              <g transform={`translate(${dx} ${dy})`}>
                {state.shapes.map((s, j) => <path key={j} d={path(s.points)} className={`fold-${s.kind}`} />)}
                {state.lines?.map((l, j) => (
                  <path key={j} className="fold-skin" d={l.arc
                    ? `M${l.points[0].join(" ")}A${l.arc.r} ${l.arc.r} 0 0 ${l.arc.sweep} ${l.points[1].join(" ")}`
                    : `M${l.points.map(p => p.join(" ")).join("L")}`} />
                ))}
                {state.hinges?.map(([hx, hy], j) => <circle key={j} cx={hx} cy={hy} r={2.6} className="fold-hinge" />)}
                {state.labels?.map(lb => <text key={lb.text} x={lb.at[0]} y={lb.at[1]} textAnchor="middle" className="fold-label">{lb.text}</text>)}
              </g>
              <text x={b.w / 2 + dx + b.x} y={height + PAD * 2 + 12} textAnchor="middle" className="fold-caption">{state.caption}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
