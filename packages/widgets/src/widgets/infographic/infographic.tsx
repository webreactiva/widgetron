import * as React from "react";

import { cn } from "@/lib/utils";

export interface InfographicItem {
  label: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export type InfographicLayout =
  | "funnel"
  | "pyramid"
  | "cycle"
  | "venn"
  | "iceberg"
  | "balance"
  | "target"
  | "hub"
  | "matrix"
  | "stairs";

export interface InfographicProps extends React.HTMLAttributes<HTMLDivElement> {
  layout: InfographicLayout;
  items: InfographicItem[];
  /** Center label for `cycle`, `venn`, `hub`. */
  center?: string;
  /** Zone captions for `iceberg` ([visible, hidden]). */
  zones?: [string, string];
  /** Tilt direction for `balance`. */
  tilt?: "left" | "right" | "equal";
  /** Axis captions for `matrix` ({ x: [low, high], y: [low, high] }). */
  axes?: { x?: [string, string]; y?: [string, string] };
}

// Theme tokens — the infographic is aseptic: colors come from CSS variables.
const FG = "var(--foreground)";
const MUTED = "var(--muted-foreground)";
const GRID = "var(--border)";

const W = 640;

/** Categorical fill for shape `i` — cycles through the chart palette. */
function chipColor(i: number): string {
  return `var(--chart-${(i % 5) + 1})`;
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
const r1 = (n: number): number => Math.round(n * 10) / 10;

interface TextOpts {
  fill?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  spacing?: string;
}

/** A monospace SVG text node — mirrors dispensa's `txt`. */
function Txt(
  props: TextOpts & { x: number; y: number; children: React.ReactNode },
): React.ReactElement {
  const {
    x,
    y,
    fill = FG,
    size = 14,
    anchor = "middle",
    weight = 700,
    spacing,
    children,
  } = props;
  return (
    <text
      x={r1(x)}
      y={r1(y)}
      textAnchor={anchor}
      className="font-mono"
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      {...(spacing ? { letterSpacing: spacing } : {})}
    >
      {children}
    </text>
  );
}

/** Numbered square chip (shape color, contrast number) — matches the HTML legend. */
function Chip({
  x,
  y,
  i,
  size = 20,
}: {
  x: number;
  y: number;
  i: number;
  size?: number;
}): React.ReactElement {
  return (
    <g>
      <rect x={r1(x)} y={r1(y)} width={size} height={size} fill={chipColor(i)} />
      <Txt x={x + size / 2} y={y + size / 2 + 4.5} fill="var(--card)" size={12}>
        {i + 1}
      </Txt>
    </g>
  );
}

interface Rendered {
  body: React.ReactNode;
  H: number;
}

// === Layouts =============================================================

function funnel(items: InfographicItem[]): Rendered {
  const n = items.length;
  const rowH = 62;
  const gap = 10;
  const topW = 560;
  const botW = 220;
  const body = items.map((it, i) => {
    const w1 = topW - (topW - botW) * (i / n);
    const w2 = topW - (topW - botW) * ((i + 1) / n);
    const y = 8 + i * (rowH + gap);
    const points = [
      [320 - w1 / 2, y],
      [320 + w1 / 2, y],
      [320 + w2 / 2, y + rowH],
      [320 - w2 / 2, y + rowH],
    ]
      .map((p) => p.map(r1).join(","))
      .join(" ");
    return (
      <g key={i}>
        <polygon points={points} fill={chipColor(i)} />
        <Txt x={320} y={y + rowH / 2 + 5} fill="var(--card)">
          {it.label}
        </Txt>
      </g>
    );
  });
  return { body, H: n * (rowH + gap) + 14 };
}

function pyramid(items: InfographicItem[]): Rendered {
  const n = items.length;
  const apexY = 28;
  const baseY = 348;
  const cx = 240;
  const halfBase = 220;
  const th = baseY - apexY;
  const labelX = cx + halfBase + 34;
  const body = items.map((it, i) => {
    const yT = apexY + (th * i) / n;
    const yB = apexY + (th * (i + 1)) / n;
    const hT = halfBase * (i / n);
    const hB = halfBase * ((i + 1) / n);
    const yMid = (yT + yB) / 2;
    const shape =
      i === 0 ? (
        <polygon
          points={`${r1(cx)},${r1(apexY)} ${r1(cx + hB)},${r1(yB)} ${r1(
            cx - hB,
          )},${r1(yB)}`}
          fill={chipColor(i)}
        />
      ) : (
        <polygon
          points={`${r1(cx - hT)},${r1(yT)} ${r1(cx + hT)},${r1(yT)} ${r1(
            cx + hB,
          )},${r1(yB)} ${r1(cx - hB)},${r1(yB)}`}
          fill={chipColor(i)}
        />
      );
    return (
      <g key={i}>
        {shape}
        <line
          x1={r1(cx + (hT + hB) / 2 + 4)}
          y1={r1(yMid)}
          x2={labelX - 8}
          y2={r1(yMid)}
          stroke={GRID}
          strokeWidth={2}
        />
        <Txt x={labelX} y={yMid + 5} anchor="start">
          {it.label}
        </Txt>
      </g>
    );
  });
  return { body, H: 380 };
}

function cycle(items: InfographicItem[], center?: string): Rendered {
  const n = items.length;
  const cx = 320;
  const cy = 200;
  const R = 142;
  const bw = 132;
  const bh = 46;
  const arrowGap = 32; // degrees kept clear around each node

  const defs = (
    <defs>
      <marker
        id="ig-arrow"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0,0 L10,5 L0,10 z" fill={MUTED} />
      </marker>
    </defs>
  );

  const arrows = items.map((_, i) => {
    const a1 = -90 + (360 * i) / n + arrowGap;
    const a2 = -90 + (360 * (i + 1)) / n - arrowGap;
    const x1 = cx + R * Math.cos(rad(a1));
    const y1 = cy + R * Math.sin(rad(a1));
    const x2 = cx + R * Math.cos(rad(a2));
    const y2 = cy + R * Math.sin(rad(a2));
    return (
      <path
        key={`a${i}`}
        d={`M ${r1(x1)} ${r1(y1)} A ${R} ${R} 0 0 1 ${r1(x2)} ${r1(y2)}`}
        fill="none"
        stroke={MUTED}
        strokeWidth={2.5}
        markerEnd="url(#ig-arrow)"
      />
    );
  });

  const boxes = items.map((it, i) => {
    const a = -90 + (360 * i) / n;
    const x = cx + R * Math.cos(rad(a));
    const y = cy + R * Math.sin(rad(a));
    return (
      <g key={`b${i}`}>
        <rect
          x={r1(x - bw / 2)}
          y={r1(y - bh / 2)}
          width={bw}
          height={bh}
          fill={chipColor(i)}
        />
        <Txt x={x} y={y + 5} fill="var(--card)" size={13}>
          {it.label}
        </Txt>
      </g>
    );
  });

  const centerLabel = center ? (
    <Txt x={cx} y={cy + 5} size={15}>
      {center}
    </Txt>
  ) : null;

  return {
    body: (
      <>
        {defs}
        {arrows}
        {boxes}
        {centerLabel}
      </>
    ),
    H: 400,
  };
}

function venn(items: InfographicItem[], center?: string): Rendered {
  const three = items.length >= 3;
  const r = three ? 112 : 125;
  const centers: [number, number][] = three
    ? [
        [265, 158],
        [375, 158],
        [320, 252],
      ]
    : [
        [245, 190],
        [395, 190],
      ];
  const labelOffsets: [number, number][] = three
    ? [
        [-62, -26],
        [62, -26],
        [0, 66],
      ]
    : [
        [-58, 0],
        [58, 0],
      ];
  const circles = centers.map(([x, y], i) => (
    <circle
      key={`c${i}`}
      cx={x}
      cy={y}
      r={r}
      fill={chipColor(i)}
      fillOpacity={0.45}
      stroke={chipColor(i)}
      strokeWidth={2}
    />
  ));
  const labels = items.slice(0, centers.length).map((it, i) => (
    <Txt
      key={`l${i}`}
      x={centers[i][0] + labelOffsets[i][0]}
      y={centers[i][1] + labelOffsets[i][1] + 5}
      size={13}
    >
      {it.label}
    </Txt>
  ));
  const centerLabel = center ? (
    <Txt x={320} y={three ? 196 : 195} size={14}>
      {center}
    </Txt>
  ) : null;
  return {
    body: (
      <>
        {circles}
        {labels}
        {centerLabel}
      </>
    ),
    H: three ? 400 : 380,
  };
}

function iceberg(
  items: InfographicItem[],
  zones: [string, string] = ["Lo visible", "Lo oculto"],
): Rendered {
  const H = 432;
  const waterY = 150;
  const hidden = items.slice(1);

  const water = (
    <>
      <rect
        x={0}
        y={waterY}
        width={W}
        height={H - waterY}
        fill={chipColor(3)}
        fillOpacity={0.14}
      />
      <line
        x1={0}
        y1={waterY}
        x2={W}
        y2={waterY}
        stroke={chipColor(3)}
        strokeWidth={2}
      />
    </>
  );
  const berg = (
    <polygon
      points="320,46 386,150 410,212 396,302 320,396 244,300 230,210 254,150"
      fill="var(--card)"
      stroke={MUTED}
      strokeWidth={2}
    />
  );

  const visible = items[0] ? (
    <>
      <Chip x={310} y={78} i={0} />
      <Txt x={320} y={116} size={13}>
        {items[0].label}
      </Txt>
    </>
  ) : null;

  // Hidden chips between y=192 and y=296 keep every label inside the berg.
  const step = hidden.length > 1 ? 104 / (hidden.length - 1) : 0;
  const hiddenLabels = hidden.map((it, j) => {
    const y = hidden.length > 1 ? 192 + step * j : 250;
    return (
      <g key={`h${j}`}>
        <Chip x={310} y={y} i={j + 1} />
        <Txt x={320} y={y + 38} size={13}>
          {it.label}
        </Txt>
      </g>
    );
  });

  const zoneLabels = (
    <>
      <Txt x={628} y={86} anchor="end" size={11} fill={MUTED} spacing="0.1em">
        {zones[0].toUpperCase()}
      </Txt>
      <Txt x={628} y={188} anchor="end" size={11} fill={MUTED} spacing="0.1em">
        {zones[1].toUpperCase()}
      </Txt>
    </>
  );

  return {
    body: (
      <>
        {water}
        {berg}
        {visible}
        {hiddenLabels}
        {zoneLabels}
      </>
    ),
    H,
  };
}

function balance(
  items: InfographicItem[],
  tilt: "left" | "right" | "equal" = "equal",
): Rendered {
  const yL = tilt === "left" ? 178 : tilt === "right" ? 122 : 150;
  const yR = tilt === "left" ? 122 : tilt === "right" ? 178 : 150;
  const fulcrum = (
    <>
      <polygon
        points="320,150 282,330 358,330"
        fill={GRID}
        stroke={MUTED}
        strokeWidth={2}
      />
      <rect x={240} y={330} width={160} height={10} fill={FG} />
    </>
  );
  const beam = (
    <>
      <line x1={150} y1={yL} x2={490} y2={yR} stroke={FG} strokeWidth={6} />
      <rect x={313} y={143} width={14} height={14} fill={FG} />
    </>
  );
  const pans = ([
    [150, yL, 0],
    [490, yR, 1],
  ] as const).map(([x, y, i]) => {
    const it = items[i];
    if (!it) return null;
    return (
      <g key={`p${i}`}>
        <line
          x1={x}
          y1={y}
          x2={x}
          y2={y + 28}
          stroke={MUTED}
          strokeWidth={2}
        />
        <rect
          x={x - 88}
          y={y + 28}
          width={176}
          height={62}
          fill={chipColor(i)}
          fillOpacity={0.16}
          stroke={chipColor(i)}
          strokeWidth={2}
        />
        <Txt x={x} y={y + 28 + 36} size={13}>
          {it.label}
        </Txt>
      </g>
    );
  });
  return {
    body: (
      <>
        {fulcrum}
        {beam}
        {pans}
      </>
    ),
    H: 372,
  };
}

function target(items: InfographicItem[]): Rendered {
  const n = items.length;
  const cx = 215;
  const cy = 204;
  const rMin = 58;
  const rMax = 182;
  const radius = (i: number) =>
    n > 1 ? rMin + ((rMax - rMin) * i) / (n - 1) : rMin + 50;

  const rings: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    rings.push(
      <circle
        key={`r${i}`}
        cx={cx}
        cy={cy}
        r={r1(radius(i))}
        fill={chipColor(i)}
        fillOpacity={0.16}
        stroke={chipColor(i)}
        strokeWidth={2}
      />,
    );
  }

  const labelX = 446;
  const labels = items.map((it, i) => {
    const ly = n > 1 ? 92 + (228 * i) / (n - 1) : 200;
    const a = n > 1 ? -64 + (76 * i) / (n - 1) : -20;
    const px = cx + radius(i) * Math.cos(rad(a));
    const py = cy + radius(i) * Math.sin(rad(a));
    return (
      <g key={`l${i}`}>
        <line
          x1={r1(px)}
          y1={r1(py)}
          x2={labelX - 10}
          y2={r1(ly - 6)}
          stroke={GRID}
          strokeWidth={2}
        />
        <Chip x={labelX - 2} y={ly - 17} i={i} size={16} />
        <Txt x={labelX + 22} y={ly - 4} anchor="start" size={13}>
          {it.label}
        </Txt>
      </g>
    );
  });

  return {
    body: (
      <>
        {rings}
        {labels}
      </>
    ),
    H: 408,
  };
}

function hub(items: InfographicItem[], center = ""): Rendered {
  const n = items.length;
  const cx = 320;
  const cy = 212;
  const rx = 222;
  const ry = 148;
  const bw = 150;
  const bh = 48;

  const positions = items.map((_, i) => {
    const a = -90 + (360 * i) / n;
    return [cx + rx * Math.cos(rad(a)), cy + ry * Math.sin(rad(a))] as const;
  });

  const spokes = positions.map(([x, y], i) => (
    <line
      key={`s${i}`}
      x1={cx}
      y1={cy}
      x2={r1(x)}
      y2={r1(y)}
      stroke={GRID}
      strokeWidth={2}
    />
  ));

  const satellites = items.map((it, i) => {
    const [x, y] = positions[i];
    return (
      <g key={`sat${i}`}>
        <rect
          x={r1(x - bw / 2)}
          y={r1(y - bh / 2)}
          width={bw}
          height={bh}
          fill={chipColor(i)}
          fillOpacity={0.16}
          stroke={chipColor(i)}
          strokeWidth={2}
        />
        <Txt x={x} y={y + 5} size={13}>
          {it.label}
        </Txt>
      </g>
    );
  });

  const hubBox = (
    <>
      <rect x={cx - 90} y={cy - 28} width={180} height={56} fill={FG} />
      <Txt x={cx} y={cy + 5} fill="var(--card)" size={15}>
        {center}
      </Txt>
    </>
  );

  return {
    body: (
      <>
        {spokes}
        {hubBox}
        {satellites}
      </>
    ),
    H: 424,
  };
}

function matrix(
  items: InfographicItem[],
  axes?: InfographicProps["axes"],
): Rendered {
  // px leaves ~120px on the left so end-anchored y-axis labels never clip.
  const px = 150;
  const py = 36;
  const qw = 230;
  const qh = 148;
  const gap = 6;
  const cells: [number, number][] = [
    [px, py],
    [px + qw + gap, py],
    [px, py + qh + gap],
    [px + qw + gap, py + qh + gap],
  ];
  const quads = items.slice(0, 4).map((it, i) => {
    const [x, y] = cells[i];
    return (
      <g key={`q${i}`}>
        <rect
          x={x}
          y={y}
          width={qw}
          height={qh}
          fill={chipColor(i)}
          fillOpacity={0.16}
          stroke={chipColor(i)}
          strokeWidth={2}
        />
        <Txt x={x + qw / 2} y={y + qh / 2 + 5} size={14}>
          {it.label}
        </Txt>
      </g>
    );
  });

  const bottomY = py + 2 * qh + gap;
  const ax = axes?.x;
  const ay = axes?.y;
  const xAxis = (
    <>
      <line
        x1={px}
        y1={bottomY + 20}
        x2={px + 2 * qw + gap}
        y2={bottomY + 20}
        stroke={FG}
        strokeWidth={2}
      />
      {ax && (
        <>
          <Txt x={px} y={bottomY + 42} anchor="start" size={12} fill={MUTED}>
            {ax[0]}
          </Txt>
          <Txt
            x={px + 2 * qw + gap}
            y={bottomY + 42}
            anchor="end"
            size={12}
            fill={MUTED}
          >
            {ax[1]}
          </Txt>
        </>
      )}
    </>
  );
  const yAxis = (
    <>
      <line
        x1={px - 20}
        y1={bottomY}
        x2={px - 20}
        y2={py}
        stroke={FG}
        strokeWidth={2}
      />
      {ay && (
        <>
          <Txt x={px - 30} y={bottomY - 2} anchor="end" size={12} fill={MUTED}>
            {ay[0]}
          </Txt>
          <Txt x={px - 30} y={py + 10} anchor="end" size={12} fill={MUTED}>
            {ay[1]}
          </Txt>
        </>
      )}
    </>
  );

  return {
    body: (
      <>
        {quads}
        {xAxis}
        {yAxis}
      </>
    ),
    H: bottomY + 56,
  };
}

function stairs(items: InfographicItem[]): Rendered {
  const n = items.length;
  const baseY = 332;
  const x0 = 40;
  const total = 560;
  const sw = total / n;
  const steps = items.map((it, i) => {
    const topY = baseY - ((i + 1) * 252) / n;
    return (
      <g key={`st${i}`}>
        <rect
          x={r1(x0 + i * sw)}
          y={r1(topY)}
          width={r1(sw - 6)}
          height={r1(baseY - topY)}
          fill={chipColor(i)}
        />
        <Txt
          x={x0 + i * sw + (sw - 6) / 2}
          y={topY + 26}
          fill="var(--card)"
          size={12}
        >
          {it.label}
        </Txt>
      </g>
    );
  });
  const ground = (
    <line
      x1={x0}
      y1={baseY}
      x2={x0 + total}
      y2={baseY}
      stroke={FG}
      strokeWidth={2}
    />
  );
  return {
    body: (
      <>
        {steps}
        {ground}
      </>
    ),
    H: 380,
  };
}

function render(
  layout: InfographicLayout,
  items: InfographicItem[],
  props: Pick<InfographicProps, "center" | "zones" | "tilt" | "axes">,
): Rendered {
  switch (layout) {
    case "funnel":
      return funnel(items);
    case "pyramid":
      return pyramid(items);
    case "cycle":
      return cycle(items, props.center);
    case "venn":
      return venn(items, props.center);
    case "iceberg":
      return iceberg(items, props.zones);
    case "balance":
      return balance(items, props.tilt);
    case "target":
      return target(items);
    case "hub":
      return hub(items, props.center);
    case "matrix":
      return matrix(items, props.axes);
    case "stairs":
      return stairs(items);
    default:
      return funnel(items);
  }
}

/**
 * Infographic — visual-metaphor templates (Napkin.ai methodology) rendered as
 * inline SVG with zero dependencies. Picks one of ten parameterized layouts
 * (funnel, pyramid, cycle, venn, iceberg, balance, target, hub, matrix,
 * stairs). Brand-agnostic: shape fills come from the `--chart-*` theme tokens
 * and text/strokes from the semantic tokens, so it themes automatically
 * (neutral base, brand palette under Web Reactiva).
 *
 * Labels inside the SVG stay 1–3 words; longer explanations live in a numbered
 * HTML legend below the graphic, with a color chip matching each shape.
 */
export function Infographic({
  layout,
  items,
  center,
  zones,
  tilt,
  axes,
  className,
  ...props
}: InfographicProps) {
  const { body, H } = render(layout, items, { center, zones, tilt, axes });
  const aria = `Infographic (${layout}): ${items.map((it) => it.label).join(", ")}`;
  const hasLegend = items.some((it) => it.description != null);

  return (
    <div
      data-slot="infographic"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={aria}
      >
        {body}
      </svg>
      {hasLegend && (
        <ol className="mt-4 space-y-2 text-sm">
          {items.map((item, i) =>
            item.description != null ? (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold text-card"
                  style={{ background: chipColor(i) }}
                >
                  {item.icon ?? i + 1}
                </span>
                <span>
                  <strong>{item.label}.</strong> {item.description}
                </span>
              </li>
            ) : null,
          )}
        </ol>
      )}
    </div>
  );
}

Infographic.displayName = "Infographic";
