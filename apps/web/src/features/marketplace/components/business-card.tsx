import { Star } from 'lucide-react';
import Link from 'next/link';
import type { EmprendimientoResumen } from '@/lib/api/types';
import { ProductImage } from './product-image';

export function BusinessCard({ emprendimiento: e }: { emprendimiento: EmprendimientoResumen }) {
  return (
    <Link
      href={`/emprendimientos/${e.id}`}
      className="flex items-center gap-3.5 rounded-lg border border-border bg-surface p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <ProductImage src={e.logoUrl} alt={e.nombre} className="size-14 shrink-0 rounded-md" />
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate font-bold">
          {e.destacado && (
            <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Destacado" />
          )}
          {e.nombre}
        </p>
        <p className="text-xs text-muted">
          {e.categoria.nombre} · {e.totalProductos} productos
        </p>
      </div>
    </Link>
  );
}
