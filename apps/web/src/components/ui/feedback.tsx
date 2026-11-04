import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-extrabold text-fg">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13.5px] text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-muted', className)} aria-hidden />;
}

export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded, already size-limited
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={cn('shrink-0 rounded-full object-cover', className)}
      />
    );
  }
  const text = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span
      style={style}
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white',
        className,
      )}
    >
      {text}
    </span>
  );
}
