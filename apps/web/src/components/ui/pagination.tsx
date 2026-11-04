import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Server-rendered pagination via links (works without JS). */
export function Pagination({
  page,
  total,
  pageSize,
  hrefFor,
}: {
  page: number;
  total: number;
  pageSize: number;
  hrefFor: (p: number) => string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const linkCls =
    'inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface text-sm';
  return (
    <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkCls} aria-label="Anterior">
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(linkCls, p === page && 'border-primary bg-primary font-bold text-white')}
        >
          {p}
        </Link>
      ))}
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={linkCls} aria-label="Siguiente">
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
