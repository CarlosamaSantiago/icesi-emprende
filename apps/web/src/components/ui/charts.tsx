import { cn } from '@/lib/utils';

export interface BarDatum {
  label: string;
  value: number;
  /** Tailwind fill class from the design tokens, e.g. `fill-primary`. */
  tone?: string;
}

/**
 * Accessible horizontal bar chart in plain SVG (HU-31). Colors come from token classes only.
 * Every bar is also available as text in the sr-only table, so the chart is never the only source.
 */
export function BarChart({
  data,
  format = (n: number) => String(n),
  caption,
  className,
}: {
  data: BarDatum[];
  format?: (n: number) => string;
  caption: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const row = 30;
  const labelW = 150;
  const valueW = 90;
  const width = 560;
  const barW = width - labelW - valueW;
  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${width} ${data.length * row + 4}`}
        className="w-full"
        role="img"
        aria-label={caption}
      >
        {data.map((d, i) => {
          const w = Math.max(d.value > 0 ? 3 : 0, (d.value / max) * barW);
          return (
            <g key={d.label} transform={`translate(0 ${i * row + 2})`}>
              <text x={labelW - 8} y={row / 2 + 4} textAnchor="end" className="fill-fg text-[11px]">
                {d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label}
              </text>
              <rect x={labelW} y={5} width={barW} height={row - 12} rx={4} className="fill-surface-muted" />
              <rect
                x={labelW}
                y={5}
                width={w}
                height={row - 12}
                rx={4}
                className={d.tone ?? 'fill-primary'}
              />
              <text x={labelW + barW + 8} y={row / 2 + 4} className="fill-muted text-[11px] font-semibold">
                {format(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Vertical columns over time (HU-36 monthly GMV). */
export function ColumnChart({
  data,
  format = (n: number) => String(n),
  caption,
  className,
}: {
  data: { label: string; value: number }[];
  format?: (n: number) => string;
  caption: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const colW = Math.min(64, Math.floor(560 / Math.max(1, data.length)));
  const width = colW * data.length;
  const h = 160;
  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${Math.max(width, 120)} ${h + 40}`}
        className="w-full"
        role="img"
        aria-label={caption}
      >
        {data.map((d, i) => {
          const bh = Math.max(d.value > 0 ? 3 : 0, (d.value / max) * h);
          const x = i * colW;
          return (
            <g key={d.label}>
              <rect x={x + 8} y={h - bh + 14} width={colW - 16} height={bh} rx={4} className="fill-primary" />
              <text
                x={x + colW / 2}
                y={h - bh + 9}
                textAnchor="middle"
                className="fill-muted text-[9px] font-semibold"
              >
                {format(d.value)}
              </text>
              <text x={x + colW / 2} y={h + 32} textAnchor="middle" className="fill-fg text-[10px]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-4', className)}>
      <p className="text-[11px] font-bold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
