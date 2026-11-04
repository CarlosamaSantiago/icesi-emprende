import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/feedback';
import { CartView } from '@/features/cart/components/cart-view';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Carrito' };

export default async function CarritoPage() {
  await requireSession();
  return (
    <>
      <PageHeader title="Carrito" subtitle="Revisa tu selección antes de confirmar" />
      <CartView />
    </>
  );
}
