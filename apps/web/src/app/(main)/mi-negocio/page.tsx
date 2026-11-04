import { Briefcase, ExternalLink, Package, Pencil, Plus, Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { getMyBusinesses } from '@/features/business/queries';
import { ProductImage } from '@/features/marketplace/components/product-image';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Mis emprendimientos' };

/** HU-06 */
export default async function MiNegocioPage() {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const items = await getMyBusinesses();

  const newBtn = (
    <Button asChild>
      <Link href="/mi-negocio/nuevo">
        <Plus aria-hidden /> Nuevo emprendimiento
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Mis emprendimientos"
        subtitle="Administra tus negocios y su catálogo"
        actions={items.length > 0 && newBtn}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aún no tienes emprendimientos"
          description="Registra tu primer emprendimiento para empezar a vender."
          action={newBtn}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Emprendimiento</Th>
              <Th>Categoría</Th>
              <Th>Estado</Th>
              <Th>Productos</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <ProductImage src={e.logoUrl} alt="" className="size-10 rounded-md" />
                    <span className="font-semibold">
                      {e.nombre}
                      {e.destacado && (
                        <Star
                          className="ml-1 inline size-3.5 fill-warning text-warning"
                          aria-label="Destacado"
                        />
                      )}
                    </span>
                  </div>
                </Td>
                <Td className="text-muted">{e.categoria.nombre}</Td>
                <Td>
                  <StatusBadge status={e.estado} />
                </Td>
                <Td>{e.totalProductos}</Td>
                <Td>
                  <div className="flex justify-end gap-1.5">
                    <Button asChild size="sm" variant="soft">
                      <Link href={`/mi-negocio/${e.id}/productos`}>
                        <Package aria-hidden /> Productos
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/mi-negocio/${e.id}/editar`}>
                        <Pencil aria-hidden /> Editar
                      </Link>
                    </Button>
                    <Button asChild size="icon" variant="ghost" aria-label="Ver ficha pública">
                      <Link href={`/emprendimientos/${e.id}`}>
                        <ExternalLink />
                      </Link>
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
