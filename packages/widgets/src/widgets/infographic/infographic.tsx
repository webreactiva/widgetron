import * as React from "react";

import { useLabels } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface InfographicLabels {
  /** Default zone captions for `iceberg` ([visible, hidden]). */
  icebergZones: [string, string];
}

export const DEFAULT_INFOGRAPHIC_LABELS: InfographicLabels = {
  icebergZones: ["The visible", "The hidden"],
};

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
  | "stairs"
  | "milestones"
  | "chevrons"
  | "roadmap"
  | "pillars";

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
  labels?: Partial<InfographicLabels>;
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

/**
 * Colored circle with the item's icon centered (via foreignObject, so any
 * `Icon` renders inside the SVG), or the 1-based number when there is none.
 */
function IconBadge({
  x,
  y,
  i,
  icon,
  r = 26,
  invert = false,
}: {
  x: number;
  y: number;
  i: number;
  icon?: React.ReactNode;
  r?: number;
  /** Card-colored circle with the icon in the chip color — for badges sitting
   * on an already chip-colored shape. */
  invert?: boolean;
}): React.ReactElement {
  const bg = invert ? "var(--card)" : chipColor(i);
  const fg = invert ? chipColor(i) : "var(--card)";
  return (
    <g>
      <circle cx={r1(x)} cy={r1(y)} r={r} fill={bg} />
      {icon != null ? (
        <foreignObject x={r1(x - r)} y={r1(y - r)} width={r * 2} height={r * 2}>
          <span
            className="flex h-full w-full items-center justify-center"
            style={{ fontSize: r, color: fg }}
          >
            {icon}
          </span>
        </foreignObject>
      ) : (
        <Txt x={x} y={y + 5} fill={fg} size={Math.max(12, r * 0.55)}>
          {i + 1}
        </Txt>
      )}
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

function iceberg(items: InfographicItem[], zones: [string, string]): Rendered {
  // A tip above the waterline, the mass below. Number chips sit on the berg's
  // axis; each label is set off to the RIGHT with a leader line, so long labels
  // never collide and the layout scales to any number of items.
  const cx = 250; // berg axis, shifted left to leave room for the side labels
  const tipY = 44;
  const waterY = 140;
  const hidden = items.slice(1);
  const rowGap = 40;
  const firstRowY = waterY + 52;
  const lastRowY = firstRowY + Math.max(0, hidden.length - 1) * rowGap;
  const bergBottom = lastRowY + 56;
  const H = bergBottom + 16;
  const bellyY = waterY + (bergBottom - waterY) * 0.4;
  const labelX = cx + 150; // 400 — clears the berg's widest point (cx + 116)

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
      points={[
        [cx, tipY - 4],
        [cx + 74, waterY],
        [cx + 116, bellyY],
        [cx + 66, bergBottom - 10],
        [cx, bergBottom],
        [cx - 66, bergBottom - 10],
        [cx - 116, bellyY],
        [cx - 74, waterY],
      ]
        .map((p) => p.map(r1).join(","))
        .join(" ")}
      fill="var(--card)"
      stroke={MUTED}
      strokeWidth={2}
    />
  );

  // One numbered chip on the axis + its label off to the right, leader-lined.
  const row = (i: number, rowY: number, it: InfographicItem) => (
    <g key={`r${i}`}>
      <line
        x1={cx + 12}
        y1={r1(rowY)}
        x2={labelX - 10}
        y2={r1(rowY)}
        stroke={GRID}
        strokeWidth={2}
      />
      <Chip x={cx - 10} y={rowY - 10} i={i} />
      <Txt x={labelX} y={rowY + 5} anchor="start" size={13}>
        {it.label}
      </Txt>
    </g>
  );

  const tip = items[0]
    ? row(0, Math.round((tipY + waterY) / 2) + 4, items[0])
    : null;
  const rows = hidden.map((it, j) => row(j + 1, firstRowY + rowGap * j, it));

  const zoneLabels = (
    <>
      <Txt
        x={14}
        y={waterY - 12}
        anchor="start"
        size={11}
        fill={MUTED}
        spacing="0.1em"
      >
        {zones[0].toUpperCase()}
      </Txt>
      <Txt
        x={14}
        y={waterY + 22}
        anchor="start"
        size={11}
        fill={MUTED}
        spacing="0.1em"
      >
        {zones[1].toUpperCase()}
      </Txt>
    </>
  );

  return {
    body: (
      <>
        {water}
        {berg}
        {tip}
        {rows}
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
    const cx = x0 + i * sw + (sw - 6) / 2;
    return (
      <g key={`st${i}`}>
        <rect
          x={r1(x0 + i * sw)}
          y={r1(topY)}
          width={r1(sw - 6)}
          height={r1(baseY - topY)}
          fill={chipColor(i)}
        />
        {it.icon != null && (
          <IconBadge x={cx} y={topY - 24} i={i} icon={it.icon} r={16} />
        )}
        <Txt x={cx} y={topY + 26} fill="var(--card)" size={12}>
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

function milestones(items: InfographicItem[]): Rendered {
  const n = items.length;
  const H = 400;
  const axisY = 200;
  const x0 = 24;
  const total = 566;
  const R = 30;
  const drop = 88;

  const marks = items.map((it, i) => {
    const x = x0 + ((i + 0.5) * total) / n;
    const up = i % 2 === 0;
    const cy = up ? axisY - drop : axisY + drop;
    const labelY = up ? cy - R - 16 : cy + R + 28;
    return (
      <g key={`ms${i}`}>
        <line
          x1={r1(x)}
          y1={r1(up ? cy + R : cy - R)}
          x2={r1(x)}
          y2={axisY}
          stroke={chipColor(i)}
          strokeWidth={2.5}
        />
        <circle cx={r1(x)} cy={axisY} r={5} fill={chipColor(i)} />
        <IconBadge x={x} y={cy} i={i} icon={it.icon} r={R} />
        <Txt x={x} y={labelY} size={13}>
          {it.label}
        </Txt>
      </g>
    );
  });

  const axis = (
    <g>
      <defs>
        <marker
          id="ig-ms-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={MUTED} />
        </marker>
      </defs>
      <line
        x1={x0 - 10}
        y1={axisY}
        x2={x0 + total + 26}
        y2={axisY}
        stroke={MUTED}
        strokeWidth={2}
        markerEnd="url(#ig-ms-arrow)"
      />
    </g>
  );

  return {
    body: (
      <>
        {axis}
        {marks}
      </>
    ),
    H,
  };
}

function chevrons(items: InfographicItem[]): Rendered {
  const n = items.length;
  const hasIcons = items.some((it) => it.icon != null);
  const x0 = 24;
  const total = 592;
  const tip = 20;
  const bandH = 56;
  const y0 = hasIcons ? 128 : 40;
  const y1 = y0 + bandH;
  const yc = (y0 + y1) / 2;
  const bw = (total - tip) / n;

  const bands = items.map((it, i) => {
    const x = x0 + i * bw;
    const notch = i > 0 ? `${r1(x + tip)},${r1(yc)} ` : "";
    const points =
      `${r1(x)},${y0} ${r1(x + bw)},${y0} ${r1(x + bw + tip)},${r1(yc)} ` +
      `${r1(x + bw)},${y1} ${r1(x)},${y1} ${notch}`.trim();
    const cx = x + tip / 2 + (bw - 6) / 2;
    return (
      <g key={`cv${i}`}>
        <polygon points={points} fill={chipColor(i)} />
        {it.icon != null && <IconBadge x={cx} y={y0 - 44} i={i} icon={it.icon} r={24} />}
        <Txt x={cx} y={yc + 5} fill="var(--card)" size={12}>
          {it.label}
        </Txt>
      </g>
    );
  });

  return { body: bands, H: y1 + 28 };
}

function roadmap(items: InfographicItem[]): Rendered {
  const n = items.length;
  const H = 400;
  const yTop = 110;
  const yBottom = 290;
  const xL = 60;
  const xR = 540;
  const R = 24;

  // A serpentine: top lane left→right, a half-circle turn on the right,
  // bottom lane right→left. Stops split between the two lanes.
  const path = `M ${xL - 24} ${yTop} L ${xR} ${yTop} A ${(yBottom - yTop) / 2} ${(yBottom - yTop) / 2} 0 0 1 ${xR} ${yBottom} L ${xL - 24} ${yBottom}`;
  const topCount = Math.ceil(n / 2);
  const bottomCount = n - topCount;

  const stops = items.map((it, i) => {
    const onTop = i < topCount;
    const laneIndex = onTop ? i : i - topCount;
    const laneCount = onTop ? topCount : bottomCount;
    const step = (xR - xL) / Math.max(laneCount, 1);
    // Bottom lane runs right→left, continuing the journey.
    const x = onTop
      ? xL + (laneIndex + 0.5) * step
      : xR - (laneIndex + 0.5) * step;
    const y = onTop ? yTop : yBottom;
    const labelY = onTop ? y - R - 14 : y + R + 26;
    return (
      <g key={`rm${i}`}>
        <IconBadge x={x} y={y} i={i} icon={it.icon} r={R} />
        <Txt x={x} y={labelY} size={13}>
          {it.label}
        </Txt>
      </g>
    );
  });

  return {
    body: (
      <>
        <path
          d={path}
          fill="none"
          stroke={GRID}
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d={path}
          fill="none"
          stroke={MUTED}
          strokeWidth={2}
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
        {stops}
      </>
    ),
    H,
  };
}

function pillars(items: InfographicItem[]): Rendered {
  const n = items.length;
  const H = 400;
  const x0 = 48;
  const total = 544;
  const gap = 18;
  const cw = (total - gap * (n - 1)) / n;
  const topY = 128;
  const baseY = 338;

  const roof = (
    <polygon
      points={`${x0 - 24},${topY - 24} 320,${topY - 84} ${x0 + total + 24},${topY - 24} ${x0 + total + 24},${topY - 12} ${x0 - 24},${topY - 12}`}
      fill={FG}
    />
  );
  const base = (
    <rect x={x0 - 24} y={baseY} width={total + 48} height={8} fill={FG} />
  );

  const columns = items.map((it, i) => {
    const x = x0 + i * (cw + gap);
    const cx = x + cw / 2;
    return (
      <g key={`pl${i}`}>
        <rect x={r1(x)} y={topY} width={r1(cw)} height={baseY - topY} fill={chipColor(i)} />
        <IconBadge x={cx} y={topY + 34} i={i} icon={it.icon} r={20} invert />
        <Txt x={cx} y={baseY + 32} size={12}>
          {it.label}
        </Txt>
      </g>
    );
  });

  return {
    body: (
      <>
        {roof}
        {columns}
        {base}
      </>
    ),
    H,
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
      return iceberg(
        items,
        props.zones ?? DEFAULT_INFOGRAPHIC_LABELS.icebergZones,
      );
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
    case "milestones":
      return milestones(items);
    case "chevrons":
      return chevrons(items);
    case "roadmap":
      return roadmap(items);
    case "pillars":
      return pillars(items);
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
  labels,
  className,
  ...props
}: InfographicProps) {
  const l = useLabels("infographic", DEFAULT_INFOGRAPHIC_LABELS, labels);
  const { body, H } = render(layout, items, {
    center,
    zones: zones ?? l.icebergZones,
    tilt,
    axes,
  });
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
                  <strong>
                    <RichText>{item.label}</RichText>.
                  </strong>{" "}
                  <RichText>{item.description}</RichText>
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
