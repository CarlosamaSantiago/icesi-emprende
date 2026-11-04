import { Store, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Pedido } from '@/lib/api/types';
import { formatCOP, formatDate } from '@/lib/utils';

/** Shared by "Mis compras" (buyer view) and "Pedidos recibidos" (seller view). */
export function OrderCard({
  pedido,
  perspective,
  actions,
}: {
  pedido: Pedido;
  perspective: 'buyer' | 'seller';
  actions?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">Pedido #{pedido.id}</p>
          <p className="text-xs text-muted">{formatDate(pedido.fechaPedido)}</p>
        </div>
        <StatusBadge status={pedido.estado} />
      </div>
      <p className="mb-3 flex items-center gap-1.5 text-[13px] text-muted">
        {perspective === 'buyer' ? (
          <>
            <Store className="size-4" aria-hidden /> {pedido.emprendimiento.nombre}
          </>
        ) : (
          <>
            <User className="size-4" aria-hidden /> {pedido.comprador.nombreCompleto} ·{' '}
            {pedido.comprador.correo}
            <span className="mx-1">→</span> {pedido.emprendimiento.nombre}
          </>
        )}
      </p>
      <ul className="divide-y divide-border rounded-md border border-border text-[13px]">
        {pedido.detalles.map((d) => (
          <li key={d.id} className="flex justify-between gap-3 px-3.5 py-2.5">
            <span>
              <strong>{d.cantidad}×</strong> {d.producto.nombre}
              <span className="ml-1 text-muted">({formatCOP(d.precioUnitario)})</span>
            </span>
            <span className="font-semibold">{formatCOP(d.subtotal)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px]">
          Total <strong className="text-base text-primary">{formatCOP(pedido.total)}</strong>
        </p>
        {actions}
      </div>
    </Card>
  );
}
