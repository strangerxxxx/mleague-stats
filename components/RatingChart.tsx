import type { RatingEvent } from "@/lib/mleague/types";
import { formatDate } from "@/lib/mleague/format";

const BASELINE = 1500;
const STEP = 20;

export function RatingChart({
  history,
  color = "#e8c547",
}: {
  history: RatingEvent[];
  color?: string;
}) {
  if (history.length < 2) {
    return <p className="text-sm text-[var(--muted)]">レーティング推移を表示する試合が不足しています。</p>;
  }

  const points = history.filter(
    (_, index) => index % Math.max(1, Math.floor(history.length / 80)) === 0 || index === history.length - 1,
  );
  const values = points.map((event) => event.ratingAfter);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  let min = snapDown(dataMin);
  let max = snapUp(dataMax);
  if (min === max) {
    min -= STEP;
    max += STEP;
  }
  const width = 720;
  const height = 260;
  const pad = { left: 56, right: 16, top: 16, bottom: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const last = Math.max(values.length - 1, 1);

  const xOf = (index: number) => pad.left + (index / last) * innerW;
  const yOf = (value: number) => pad.top + (1 - (value - min) / (max - min)) * innerH;

  const coords = values.map((value, index) => `${xOf(index)},${yOf(value)}`);
  const yTicks: number[] = [];
  for (let tick = min; tick <= max + 1e-9; tick += STEP) {
    yTicks.push(tick);
  }
  const xTickCount = Math.min(5, points.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const index = Math.round((i / Math.max(xTickCount - 1, 1)) * last);
    return { index, date: points[index].date };
  }).filter((tick, i, list) => list.findIndex((item) => item.index === tick.index) === i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="レーティング推移">
      {yTicks.map((tick) => {
        const isBaseline = tick === BASELINE;
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke={isBaseline ? "rgba(232,197,71,0.45)" : "rgba(246,243,234,0.12)"}
              strokeDasharray={isBaseline ? "4 4" : undefined}
            />
            <text
              x={pad.left - 8}
              y={yOf(tick) + 4}
              textAnchor="end"
              fill={isBaseline ? "#e8c547" : "#9aa3b5"}
              fontSize="11"
              fontFamily="var(--font-geist-mono), ui-monospace, monospace"
            >
              {tick}
            </text>
          </g>
        );
      })}
      <line
        x1={pad.left}
        x2={pad.left}
        y1={pad.top}
        y2={height - pad.bottom}
        stroke="rgba(246,243,234,0.32)"
      />
      <line
        x1={pad.left}
        x2={width - pad.right}
        y1={height - pad.bottom}
        y2={height - pad.bottom}
        stroke="rgba(246,243,234,0.32)"
      />
      {xTicks.map((tick) => (
        <text
          key={`${tick.date}-${tick.index}`}
          x={xOf(tick.index)}
          y={height - 12}
          textAnchor="middle"
          fill="#9aa3b5"
          fontSize="11"
        >
          {formatDate(tick.date)}
        </text>
      ))}
      <polyline fill="none" stroke={color} strokeWidth="3" points={coords.join(" ")} />
    </svg>
  );
}

function snapDown(value: number): number {
  return Math.floor((value - BASELINE) / STEP) * STEP + BASELINE;
}

function snapUp(value: number): number {
  return Math.ceil((value - BASELINE) / STEP) * STEP + BASELINE;
}
