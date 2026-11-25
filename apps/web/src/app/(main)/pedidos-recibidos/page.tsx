import { Inbox } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { ESTADOS_PEDIDO } from '@/features/orders/schemas';
import { RegisterPaymentButton } from '@/features/payments/components/register-payment-button';
import { OrderCard } from '@/features/orders/components/order-card';
import { OrderStatusActions } from '@/features/orders/components/order-status-actions';
import { getPedidosRecibidos } from '@/features/orders/queries';
import { requireSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Pedidos recibidos' };

/** HU-22/23: orders for the current user's businesses only (enforced by the API). */
export default async function PedidosRecibidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const { estado } = await searchParams;
  const all = await getPedidosRecibidos();
  const pedidos = estado ? all.filter((p) => p.estado === estado) : all;

  return (
    <>
      <PageHeader title="Pedidos recibidos" subtitle="Gestiona los pedidos de tus emprendimientos" />
      <nav aria-label="Filtrar por estado" className="mb-5 flex flex-wrap gap-2">
        {[undefined, ...ESTADOS_PEDIDO].map((e) => {
          const count = e ? all.filter((p) => p.estado === e).length : all.length;
          return (
            <Link
              key={e ?? 'todos'}
              href={e ? `/pedidos-recibidos?estado=${e}` : '/pedidos-recibidos'}
              aria-current={estado === e ? 'page' : undefined}
              className={cn(
                'rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold capitalize transition',
                estado === e
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-muted hover:border-primary',
              )}
            >
              {(e ?? 'Todos').toLowerCase()} ({count})
            </Link>
          );
        })}
      </nav>
      {pedidos.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No hay pedidos"
          description="Cuando un comprador confirme un pedido aparecerá aquí."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {pedidos.map((p) => (
            <OrderCard
              key={p.id}
              pedido={p}
              perspective="seller"
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {p.puedeRegistrarPago && (
                    <RegisterPaymentButton pedidoId={p.id} total={p.total} actual={p.pago?.estado} />
                  )}
                  <OrderStatusActions pedidoId={p.id} allowed={p.transicionesPermitidas} />
                </div>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
