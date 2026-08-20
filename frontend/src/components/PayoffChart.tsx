import type { PayoffMonth } from "../types";
import { formatCurrency } from "../format";

interface PayoffChartProps {
  schedule: PayoffMonth[];
  enrolledDebt: number;
}

const WIDTH = 520;
const HEIGHT = 180;
const PADDING = { top: 12, right: 12, bottom: 24, left: 56 };

/**
 * Minimal dependency-free area chart of projected settled amounts over time.
 */
export function PayoffChart({ schedule, enrolledDebt }: PayoffChartProps) {
  if (schedule.length === 0) return null;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  // A single-month plan would divide by zero, so floor the denominator at 1.
  const lastMonth = Math.max(schedule.length - 1, 1);

  const x = (index: number) => PADDING.left + (index / lastMonth) * plotWidth;
  const y = (value: number) =>
    PADDING.top + plotHeight - (value / enrolledDebt) * plotHeight;

  const points: Array<[number, number]> = schedule.map((point, i) => [
    x(i),
    y(point.projected_settled),
  ]);

  // A single-month plan is one point, and a lone moveto draws nothing at all.
  // Extend it into a flat segment so the chart still shows the payoff.
  if (points.length === 1) {
    points.push([PADDING.left + plotWidth, points[0][1]]);
  }

  const line = points
    .map(([px, py], i) => `${i === 0 ? "M" : "L"} ${px} ${py}`)
    .join(" ");

  const baseline = PADDING.top + plotHeight;
  const area = `${line} L ${points[points.length - 1][0]} ${baseline} L ${points[0][0]} ${baseline} Z`;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Projected settled amount over time"
    >
      {[0, 0.5, 1].map((ratio) => {
        const value = enrolledDebt * ratio;
        return (
          <g key={ratio}>
            <line
              className="chart__gridline"
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(value)}
              y2={y(value)}
            />
            <text className="chart__tick" x={PADDING.left - 8} y={y(value) + 4}>
              {formatCurrency(value)}
            </text>
          </g>
        );
      })}

      <path className="chart__area" d={area} />
      <path className="chart__line" d={line} />

      <text className="chart__tick" x={PADDING.left} y={HEIGHT - 6}>
        Month 1
      </text>
      <text
        className="chart__tick chart__tick--end"
        x={WIDTH - PADDING.right}
        y={HEIGHT - 6}
      >
        Month {schedule.length}
      </text>
    </svg>
  );
}
