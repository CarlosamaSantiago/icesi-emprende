'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { EstadoVisibilidad } from '@/lib/api/types';
import { setProductStatusAction } from '../actions';

/** HU-13 */
export function ProductStatusToggle({
  productoId,
  estado,
}: {
  productoId: number;
  estado: EstadoVisibilidad;
}) {
  const [pending, startTransition] = useTransition();
  const active = estado === 'ACTIVO';
  return (
    <Button
      size="sm"
      variant={active ? 'secondary' : 'soft'}
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setProductStatusAction({ productoId, estado: active ? 'INACTIVO' : 'ACTIVO' });
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        })
      }
    >
      {active ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      {active ? 'Desactivar' : 'Activar'}
    </Button>
  );
}
