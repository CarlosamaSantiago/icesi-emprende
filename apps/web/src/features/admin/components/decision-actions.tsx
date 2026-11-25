'use client';

import { Check, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Field, Textarea } from '@/components/ui/form';
import type { EmprendimientoAdmin } from '@/lib/api/types';
import { decideBusinessAction } from '../actions';

/** HU-43: approve (confirm) or reject (reason required) a business awaiting CIEI review. */
export function DecisionActions({ emprendimiento: e }: { emprendimiento: EmprendimientoAdmin }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const reapproval = e.estado === 'INACTIVO' && e.ultimaDecision?.decision === 'RECHAZADO';

  const approve = async () => {
    const res = await decideBusinessAction({ id: e.id, decision: 'APROBADO' });
    if (res.ok) toast.success(res.message);
    else toast.error(res.error);
  };
  const reject = () =>
    startTransition(async () => {
      setError(undefined);
      const res = await decideBusinessAction({ id: e.id, decision: 'RECHAZADO', motivo });
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        setMotivo('');
      } else setError(res.fieldErrors?.motivo ?? res.error);
    });

  return (
    <div className="flex justify-end gap-1.5">
      <ConfirmDialog
        trigger={
          <Button size="sm" variant="success">
            <Check aria-hidden /> {reapproval ? 'Aprobar de nuevo' : 'Aprobar'}
          </Button>
        }
        title={`¿Aprobar ${e.nombre}?`}
        description="Pasará a estado activo y será visible en el marketplace. El propietario recibirá una notificación."
        confirmLabel="Aprobar"
        onConfirm={approve}
      />
      {!reapproval && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="soft-danger">
              <X aria-hidden /> Rechazar
            </Button>
          </DialogTrigger>
          <DialogContent
            title={`Rechazar ${e.nombre}`}
            description="El motivo se guarda en el historial y se envía al emprendedor."
            className="max-w-md"
          >
            <Field label="Motivo del rechazo" htmlFor={`motivo-${e.id}`} required error={error}>
              <Textarea
                id={`motivo-${e.id}`}
                value={motivo}
                maxLength={500}
                onChange={(ev) => setMotivo(ev.target.value)}
                aria-invalid={!!error}
                aria-describedby={`motivo-${e.id}-msg`}
              />
            </Field>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button variant="danger" loading={pending} onClick={reject}>
                Rechazar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
