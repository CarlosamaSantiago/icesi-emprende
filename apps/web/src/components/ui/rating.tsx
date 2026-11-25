import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Read-only stars. `value` null = no ratings yet (never shown as 0 — HU-38 CA3). */
export function RatingStars({
  value,
  total,
  size = 'md',
  className,
}: {
  value: number | null;
  total?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (value === null)
    return <span className={cn('text-xs text-muted', className)}>Sin calificaciones aún</span>;
  const rounded = Math.round(value);
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={`${value.toFixed(1)} de 5${total !== undefined ? `, ${total} calificaciones` : ''}`}
    >
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              size === 'sm' ? 'size-3.5' : 'size-4',
              n <= rounded ? 'fill-warning text-warning' : 'text-border',
            )}
          />
        ))}
      </span>
      <span className="text-[13px] font-bold">{value.toFixed(1)}</span>
      {total !== undefined && <span className="text-xs text-muted">({total})</span>}
    </span>
  );
}
