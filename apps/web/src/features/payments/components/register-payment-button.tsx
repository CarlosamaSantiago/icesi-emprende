'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/form';
import type { EstadoPago } from '@/lib/api/types';
import { formatCOP } from '@/lib/utils';
import { registerPaymentAction } from '../actions';

const COMISION = 0.1;
const PASARELA = 0.02;

/** HU-44: record the payment of an order; shows the 10 % CIEI commission and 2 % gateway cost before saving. */
export function RegisterPaymentButton({
  pedidoId,
  total,
  actual,
}: {
  pedidoId: number;
  total: number;
  actual?: EstadoPago;
}) {
  const [open, setOpen] = useState(false);
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (estado: 'CONFIRMADO' | 'FALLIDO') =>
    startTransition(async () => {
      setError(undefined);
      const res = await registerPaymentAction({ pedidoId, estado, referencia: referencia || undefined });
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
      } else setError(res.fieldErrors?.referencia ?? res.error);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          {actual ? 'Actualizar pago' : 'Registrar pago'}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={`Pago del pedido #${pedidoId}`}
        description="Registra el resultado del pago. Un pago fallido no cuenta como ingreso."
        className="max-w-md"
      >
        <dl className="mb-4 space-y-1 rounded-md bg-surface-muted p-3.5 text-[13px]">
          <div className="flex justify-between">
            <dt>Total del pedido</dt>
            <dd className="font-semibold">{formatCOP(total)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Comisión CIEI (10 %)</dt>
            <dd>{formatCOP(Math.round(total * COMISION * 100) / 100)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Costo pasarela (2 %)</dt>
            <dd>{formatCOP(Math.round(total * PASARELA * 100) / 100)}</dd>
          </div>
        </dl>
        <Field label="Referencia (opcional)" htmlFor={`ref-${pedidoId}`} error={error}>
          <Input
            id={`ref-${pedidoId}`}
            value={referencia}
            maxLength={100}
            onChange={(e) => setReferencia(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={`ref-${pedidoId}-msg`}
          />
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button variant="soft-danger" loading={pending} onClick={() => run('FALLIDO')}>
            Pago fallido
          </Button>
          <Button variant="success" loading={pending} onClick={() => run('CONFIRMADO')}>
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
