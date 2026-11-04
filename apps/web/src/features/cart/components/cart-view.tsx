'use client';

import { ShoppingCart, Store, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { FormError } from '@/components/ui/form';
import { ProductImage } from '@/features/marketplace/components/product-image';
import { checkoutAction } from '@/features/orders/actions';
import { formatCOP } from '@/lib/utils';
import { cartTotal, groupByEmprendimiento, useCart } from '../store';
import { QuantityInput } from './quantity-input';

/** HU-18/19/20: review lines, edit quantities, see subtotals per business, confirm. */
export function CartView() {
  const { items, setQuantity, remove, clear } = useCart();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Skeleton className="h-64 w-full" />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Tu carrito está vacío"
        description="Explora el marketplace y agrega productos de distintos emprendimientos."
        action={
          <Button asChild>
            <Link href="/marketplace">Ir al marketplace</Link>
          </Button>
        }
      />
    );
  }

  const groups = groupByEmprendimiento(items);
  const total = cartTotal(items);

  const confirm = () =>
    new Promise<void>((resolve) =>
      startTransition(async () => {
        setError(undefined);
        const res = await checkoutAction({
          items: items.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
        });
        if (res.ok) {
          clear();
          toast.success(
            res.data.length === 1
              ? 'Pedido creado'
              : `${res.data.length} pedidos creados, uno por emprendimiento`,
          );
          router.push('/mis-compras');
        } else {
          setError(res.error); // HU-20 CA4: never claim success without confirmation
        }
        resolve();
      }),
    );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {groups.map((g) => (
          <Card key={g.emprendimiento.id} className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <Link
                href={`/emprendimientos/${g.emprendimiento.id}`}
                className="flex items-center gap-2 font-bold hover:text-primary"
              >
                <Store className="size-4 text-primary" aria-hidden /> {g.emprendimiento.nombre}
              </Link>
              <span className="text-[13px] text-muted">
                Subtotal <strong className="text-fg">{formatCOP(g.subtotal)}</strong>
              </span>
            </div>
            <ul className="divide-y divide-border">
              {g.items.map((it) => (
                <li key={it.productoId} className="flex flex-wrap items-center gap-4 py-3">
                  <ProductImage src={it.imagen} alt={it.nombre} className="size-14 rounded-md" />
                  <div className="min-w-40 flex-1">
                    <Link href={`/productos/${it.productoId}`} className="font-semibold hover:text-primary">
                      {it.nombre}
                    </Link>
                    <p className="text-xs text-muted">
                      {formatCOP(it.precio)} c/u · máx. {it.stock}
                    </p>
                  </div>
                  <QuantityInput
                    value={it.cantidad}
                    max={it.stock}
                    onChange={(v) => setQuantity(it.productoId, v)}
                  />
                  <p className="w-24 text-right font-bold">{formatCOP(it.precio * it.cantidad)}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(it.productoId)}
                    aria-label={`Quitar ${it.nombre}`}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <ConfirmDialog
          trigger={
            <Button variant="soft-danger" size="sm">
              <Trash2 aria-hidden /> Vaciar carrito
            </Button>
          }
          title="¿Vaciar el carrito?"
          description="Se quitarán todos los productos."
          confirmLabel="Vaciar"
          tone="danger"
          onConfirm={clear}
        />
      </div>

      <Card className="h-fit p-6 lg:sticky lg:top-24">
        <CardTitle>Resumen</CardTitle>
        <dl className="mt-4 space-y-2 text-[13.5px]">
          {groups.map((g) => (
            <div key={g.emprendimiento.id} className="flex justify-between">
              <dt className="truncate text-muted">{g.emprendimiento.nombre}</dt>
              <dd>{formatCOP(g.subtotal)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 text-base font-extrabold">
            <dt>Total</dt>
            <dd className="text-primary">{formatCOP(total)}</dd>
          </div>
        </dl>
        {groups.length > 1 && (
          <p className="mt-3 rounded-md bg-primary-soft px-3 py-2 text-xs text-primary">
            Se crearán {groups.length} pedidos, uno por cada emprendimiento.
          </p>
        )}
        <div className="mt-4 space-y-3">
          <FormError message={error} />
          <ConfirmDialog
            trigger={
              <Button size="lg" className="w-full" loading={pending}>
                Confirmar pedido
              </Button>
            }
            title="Confirmar pedido"
            description={`Total ${formatCOP(total)} en ${groups.length} pedido(s). El precio final lo confirma cada emprendimiento según su inventario.`}
            confirmLabel="Confirmar"
            onConfirm={confirm}
          />
        </div>
      </Card>
    </div>
  );
}
