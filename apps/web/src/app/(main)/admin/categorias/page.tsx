import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/feedback';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { CategoryDialog, DeleteCategoryButton } from '@/features/admin/components/category-manager';
import { api } from '@/lib/api/client';
import type { CategoriaAdmin } from '@/lib/api/types';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Categorías' };

/** HU-28. ADMIN only. */
export default async function AdminCategoriasPage() {
  await requireSession('ADMIN');
  const categorias = await api<CategoriaAdmin[]>('/admin/categorias');
  return (
    <>
      <PageHeader
        title="Categorías"
        subtitle="Clasifican los emprendimientos del marketplace"
        actions={<CategoryDialog />}
      />
      <Table>
        <thead>
          <tr>
            <Th>Nombre</Th>
            <Th>Descripción</Th>
            <Th>Emprendimientos</Th>
            <Th className="text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <Tr key={c.id}>
              <Td className="font-semibold">{c.nombre}</Td>
              <Td className="text-muted">{c.descripcion ?? '—'}</Td>
              <Td>{c.totalEmprendimientos}</Td>
              <Td>
                <div className="flex justify-end gap-1.5">
                  <CategoryDialog categoria={c} />
                  <DeleteCategoryButton categoria={c} />
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
