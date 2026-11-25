'use client';

import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Role, UsuarioAdmin } from '@/lib/api/types';
import { assignRoleAction, deleteUserAction, revokeRoleAction } from '../actions';

const ALL: Role[] = ['ADMIN', 'EMPRENDEDOR', 'COMPRADOR'];
const notify = (r: { ok: boolean; message?: string; error?: string }) =>
  r.ok ? toast.success(r.message) : toast.error(r.error);

/** HU-27 (roles) + HU-26 (delete). Every action is confirmed; the API enforces the guard rails. */
export function UserRowActions({ user, selfId }: { user: UsuarioAdmin; selfId: number }) {
  const missing = ALL.filter((r) => !user.roles.includes(r));
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {missing.map((r) => (
        <ConfirmDialog
          key={`add-${r}`}
          trigger={
            <Button size="sm" variant="soft" aria-label={`Asignar rol ${r} a ${user.nombreCompleto}`}>
              <Plus aria-hidden /> {r.toLowerCase()}
            </Button>
          }
          title={`¿Asignar ${r} a ${user.nombreCompleto}?`}
          description="El cambio aplica de inmediato en su próxima solicitud."
          onConfirm={async () => notify(await assignRoleAction({ id: user.id, rol: r }))}
        />
      ))}
      {user.roles.length > 1 &&
        user.roles.map((r) => (
          <ConfirmDialog
            key={`rm-${r}`}
            trigger={
              <Button size="sm" variant="ghost" aria-label={`Quitar rol ${r} a ${user.nombreCompleto}`}>
                <X aria-hidden /> {r.toLowerCase()}
              </Button>
            }
            title={`¿Quitar ${r} a ${user.nombreCompleto}?`}
            description="Perderá los permisos de ese rol de inmediato."
            confirmLabel="Quitar rol"
            tone="danger"
            onConfirm={async () => notify(await revokeRoleAction({ id: user.id, rol: r }))}
          />
        ))}
      {user.id !== selfId && (
        <ConfirmDialog
          trigger={
            <Button size="sm" variant="soft-danger" aria-label={`Eliminar a ${user.nombreCompleto}`}>
              <Trash2 aria-hidden />
            </Button>
          }
          title={`¿Eliminar a ${user.nombreCompleto}?`}
          description="Se borran su cuenta y datos personales. No se puede deshacer. Las cuentas con emprendimientos o pedidos no pueden eliminarse."
          confirmLabel="Eliminar"
          tone="danger"
          onConfirm={async () => notify(await deleteUserAction({ id: user.id }))}
        />
      )}
    </div>
  );
}
