'use client';

import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { EstadoPedido } from '@/lib/api/types';
import { updateOrderStatusAction } from '../actions';

const ACTION: Record<EstadoPedido, { label: string; variant: ButtonProps['variant'] }> = {
  CONFIRMADO: { label: 'Confirmar', variant: 'primary' },
  PREPARANDO: { label: 'Marcar preparando', variant: 'soft' },
  ENTREGADO: { label: 'Marcar entregado', variant: 'success' },
  CANCELADO: { label: 'Cancelar', variant: 'soft-danger' },
  PENDIENTE: { label: 'Pendiente', variant: 'secondary' },
};

/** HU-23 CA1: only the transitions the API reports as allowed are offered. */
export function OrderStatusActions({ pedidoId, allowed }: { pedidoId: number; allowed: EstadoPedido[] }) {
  if (allowed.length === 0) return null;

  const run = async (estado: EstadoPedido) => {
    const res = await updateOrderStatusAction({ pedidoId, estado });
    if (res.ok) toast.success(res.message);
    else toast.error(res.error);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {allowed.map((estado) => {
        const a = ACTION[estado];
        const isCancel = estado === 'CANCELADO';
        return (
          <ConfirmDialog
            key={estado}
            trigger={
              <Button size="sm" variant={a.variant}>
                {a.label}
              </Button>
            }
            title={isCancel ? `¿Cancelar el pedido #${pedidoId}?` : `${a.label} pedido #${pedidoId}`}
            description={
              isCancel
                ? 'El comprador verá el pedido como cancelado. Esta acción no se puede deshacer.'
                : 'El comprador verá el nuevo estado en su seguimiento.'
            }
            confirmLabel={a.label}
            tone={isCancel ? 'danger' : 'primary'}
            onConfirm={() => run(estado)}
          />
        );
      })}
    </div>
  );
}
