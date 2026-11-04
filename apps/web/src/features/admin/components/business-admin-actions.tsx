'use client';

import { Eye, EyeOff, Star } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { EmprendimientoResumen } from '@/lib/api/types';
import { setBusinessFeaturedAction, setBusinessVisibilityAction } from '../actions';

function notify(res: { ok: boolean; message?: string; error?: string }) {
  if (res.ok) toast.success(res.message);
  else toast.error(res.error);
}

export function BusinessAdminActions({ emprendimiento: e }: { emprendimiento: EmprendimientoResumen }) {
  const [pending, startTransition] = useTransition();
  const active = e.estado === 'ACTIVO';

  return (
    <div className="flex justify-end gap-1.5">
      <Button
        size="sm"
        variant={e.destacado ? 'soft' : 'ghost'}
        loading={pending}
        aria-pressed={e.destacado}
        onClick={() =>
          startTransition(async () =>
            notify(await setBusinessFeaturedAction({ id: e.id, destacado: !e.destacado })),
          )
        }
      >
        <Star className={e.destacado ? 'fill-current' : ''} aria-hidden />
        {e.destacado ? 'Destacado' : 'Destacar'}
      </Button>
      <ConfirmDialog
        trigger={
          <Button size="sm" variant={active ? 'soft-danger' : 'success'}>
            {active ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            {active ? 'Desactivar' : 'Activar'}
          </Button>
        }
        title={active ? `¿Desactivar ${e.nombre}?` : `¿Activar ${e.nombre}?`}
        description={
          active
            ? 'Dejará de mostrarse en el marketplace y no podrá recibir nuevos pedidos.'
            : 'Será visible en el marketplace y podrá recibir pedidos.'
        }
        confirmLabel={active ? 'Desactivar' : 'Activar'}
        tone={active ? 'danger' : 'primary'}
        onConfirm={async () =>
          notify(await setBusinessVisibilityAction({ id: e.id, estado: active ? 'INACTIVO' : 'ACTIVO' }))
        }
      />
    </div>
  );
}
