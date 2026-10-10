// Diagrams for the facts page, each a row of states ("flat", "folded"...).
// They are computed rather than sketched: folded panels rotate about their real
// hinge points, and woven threads keep their length as the weave shears.

type Pt = [number, number];
type Shape = { points: Pt[]; kind: "panel" | "ghost" };
type Line = { points: Pt[]; arc?: { r: number; sweep: 0 | 1 } };
type Label = { at: Pt; text: string };
type State = { caption: string; shapes: Shape[]; lines?: Line[]; hinges?: Pt[]; labels?: Label[] };

export type FigureKind = "wrap" | "tapered" | "offset" | "double" | "membrane" | "seam" | "bias";

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

// Seam allowance: the fabric between the cut edge and the stitch line, which
// ends up folded inside the seam.
const ALLOW = 16;
const SEAM_W = 84, SEAM_H = 46;

// A woven square: threads at angle a to the pull on either side. Pulled on the
// bias the threads can't stretch, so the squares lean into diamonds instead.
function weave(a: number, n = 4, cell = 14): Pick<State, "shapes" | "lines"> {
  const d1: Pt = [Math.cos(a), -Math.sin(a)], d2: Pt = [Math.cos(a), Math.sin(a)];
  const at = (i: number, j: number): Pt => [cell * (i * d1[0] + j * d2[0]), cell * (i * d1[1] + j * d2[1])];
  const inner = Array.from({ length: n - 1 }, (_, k) => k + 1);
  return {
    shapes: [panel([at(0, 0), at(n, 0), at(n, n), at(0, n)])],
    lines: [...inner.map(k => ({ points: [at(k, 0), at(k, n)] })), ...inner.map(k => ({ points: [at(0, k), at(n, k)] }))],
  };
}

// An arrow pulling outward from a corner of the weave at x, dir -1 for left.
const pull = (x: number, dir: 1 | -1): Line[] => [
  { points: [[x + dir * 3, 0], [x + dir * 16, 0]] },
  { points: [[x + dir * 12, -3], [x + dir * 16, 0], [x + dir * 12, 3]] },
];

const FIGURES: Record<FigureKind, State[]> = {
  seam: [
    {
      caption: "cut piece",
      shapes: [panel(rect(0, 0, SEAM_W + 2 * ALLOW, SEAM_H + 2 * ALLOW)), { points: rect(ALLOW, ALLOW, SEAM_W, SEAM_H), kind: "ghost" }],
      labels: [{ at: [ALLOW + SEAM_W / 2, ALLOW - 4], text: "10mm" }, { at: [ALLOW + SEAM_W / 2, ALLOW + SEAM_H / 2 + 4], text: "finished size" }],
    },
    {
      // Two pieces joined by a plain seam and pressed open: the outside is
      // smooth, and each allowance folds back flat underneath its own piece.
      caption: "sewn and pressed, end on",
      shapes: [],
      lines: ([-1, 1] as const).flatMap(dir => {
        const x = SEAM_W + dir * 6;
        return [
          { points: [[SEAM_W + dir * SEAM_W, 0], [x, 0]] as Pt[] },
          { points: [[x, 0], [x, 10]] as Pt[], arc: { r: 5, sweep: dir < 0 ? 1 : 0 } as const },
          { points: [[x, 10], [x + dir * ALLOW, 10]] as Pt[] },
        ];
      }),
      hinges: [[SEAM_W, 5]],
      labels: [{ at: [SEAM_W, -8], text: "outside" }, { at: [SEAM_W - 6 - ALLOW / 2, 25], text: "10mm" }],
    },
  ],
  bias: [
    { caption: "at rest", ...weave(Math.PI / 4) },
    (() => {
      const { shapes, lines } = weave(Math.PI / 6);
      const right = Math.max(...shapes[0].points.map(([x]) => x));
      return { caption: "pulled on the bias", shapes, lines: [...lines!, ...pull(0, -1), ...pull(right, 1)] };
    })(),
  ],
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

export function FactFigure({ kind, label, scale = SCALE }: { kind: FigureKind; label: string; scale?: number }) {
  const states = FIGURES[kind];
  const boxes = states.map(bounds);
  const height = Math.max(...boxes.map(b => b.h));
  const width = boxes.reduce((sum, b) => sum + b.w, 0) + GAP * (states.length - 1);
  // Each state's left edge: laid out in a row, GAP apart.
  const lefts = boxes.map((_, i) => PAD + boxes.slice(0, i).reduce((sum, b) => sum + b.w + GAP, 0));
  const w = width + PAD * 2, h = height + PAD * 2 + 18;
  return (
    <div className="fig">
      <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
        {states.map((state, i) => {
          const b = boxes[i];
          // Sit every state on the same baseline.
          const dx = lefts[i] - b.x, dy = PAD + height - (b.y + b.h);
          return (
            <g key={state.caption}>
              <g transform={`translate(${dx} ${dy})`}>
                {state.shapes.map((s, j) => <path key={j} d={path(s.points)} className={`fig-${s.kind}`} />)}
                {state.lines?.map((l, j) => (
                  <path key={j} className="fig-skin" d={l.arc
                    ? `M${l.points[0].join(" ")}A${l.arc.r} ${l.arc.r} 0 0 ${l.arc.sweep} ${l.points[1].join(" ")}`
                    : `M${l.points.map(p => p.join(" ")).join("L")}`} />
                ))}
                {state.hinges?.map(([hx, hy], j) => <circle key={j} cx={hx} cy={hy} r={2.6} className="fig-hinge" />)}
                {state.labels?.map(lb => <text key={lb.text} x={lb.at[0]} y={lb.at[1]} textAnchor="middle" className="fig-label">{lb.text}</text>)}
              </g>
              <text x={b.w / 2 + dx + b.x} y={height + PAD * 2 + 12} textAnchor="middle" className="fig-caption">{state.caption}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
