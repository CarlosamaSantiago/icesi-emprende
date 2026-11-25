import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/feedback';
import { Input } from '@/components/ui/form';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { UserRowActions } from '@/features/admin/components/user-row-actions';
import { api } from '@/lib/api/client';
import type { UsuarioAdmin } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Usuarios y roles' };

/** HU-26 + HU-27. ADMIN only — enforced again by the API. */
export default async function AdminUsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireSession('ADMIN');
  const { q } = await searchParams;
  const users = await api<UsuarioAdmin[]>('/admin/usuarios', { query: { q } });

  return (
    <>
      <PageHeader title="Usuarios y roles" subtitle={`${users.length} cuenta(s)`} />
      <form className="mb-5 max-w-sm" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, correo o programa"
          aria-label="Buscar usuarios"
        />
      </form>
      <Table>
        <thead>
          <tr>
            <Th>Usuario</Th>
            <Th>Programa</Th>
            <Th>Roles</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <Tr key={u.id}>
              <Td>
                <p className="font-semibold">{u.nombreCompleto}</p>
                <p className="text-xs text-muted">{u.correo}</p>
              </Td>
              <Td className="text-muted">
                {u.programaAcademico} · sem. {u.semestreAcademico}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <Badge
                      key={r}
                      tone={r === 'ADMIN' ? 'accent' : r === 'EMPRENDEDOR' ? 'primary' : 'neutral'}
                    >
                      {r.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </Td>
              <Td>
                <UserRowActions user={u} selfId={me.id} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
