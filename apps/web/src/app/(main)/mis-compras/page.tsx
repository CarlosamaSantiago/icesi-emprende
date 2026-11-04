import { ShoppingBag } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { OrderCard } from '@/features/orders/components/order-card';
import { getMisCompras } from '@/features/orders/queries';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Mis compras' };

/** HU-21: only the current user's orders (enforced by the API). */
export default async function MisComprasPage() {
  await requireSession();
  const pedidos = await getMisCompras();

  return (
    <>
      <PageHeader title="Mis compras" subtitle="Sigue el estado de cada pedido" />
      {pedidos.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Aún no tienes pedidos"
          action={
            <Button asChild>
              <Link href="/marketplace">Explorar marketplace</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {pedidos.map((p) => (
            <OrderCard key={p.id} pedido={p} perspective="buyer" />
          ))}
        </div>
      )}
    </>
  );
}
