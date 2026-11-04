import { Store } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from '@/features/cart/components/add-to-cart-button';
import type { ProductoResumen } from '@/lib/api/types';
import { formatCOP } from '@/lib/utils';
import { ProductImage } from './product-image';

/** HU-15 CA1: seller info, price and visual content. */
export function ProductCard({
  producto,
  authenticated,
}: {
  producto: ProductoResumen;
  authenticated: boolean;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/productos/${producto.id}`} className="relative block">
        <ProductImage src={producto.imagenPrincipal} alt={producto.nombre} className="h-40 w-full" />
        <Badge tone="solid" className="absolute top-2 left-2 text-[9px]">
          {producto.emprendimiento.categoria}
        </Badge>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/productos/${producto.id}`} className="line-clamp-1 font-bold hover:text-primary">
          {producto.nombre}
        </Link>
        <Link
          href={`/emprendimientos/${producto.emprendimiento.id}`}
          className="mt-0.5 flex items-center gap-1 text-xs text-muted hover:text-primary"
        >
          <Store className="size-3" aria-hidden /> {producto.emprendimiento.nombre}
        </Link>
        <p className="mt-2 line-clamp-2 flex-1 text-[12.5px] text-muted">{producto.descripcion}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-extrabold text-primary">{formatCOP(producto.precio)}</p>
            <p className="text-[11px] text-muted">
              {producto.stockDisponible > 0 ? `${producto.stockDisponible} disponibles` : 'Agotado'}
            </p>
          </div>
          <AddToCartButton producto={producto} authenticated={authenticated} />
        </div>
      </div>
    </article>
  );
}
