import { ArrowLeft, PackageOpen, Pencil, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { ProductStatusToggle } from '@/features/business/components/product-status-toggle';
import { loadOwned } from '@/features/business/load';
import { getMyBusiness, getMyBusinessProducts } from '@/features/business/queries';
import { ProductImage } from '@/features/marketplace/components/product-image';
import { requireSession } from '@/lib/auth/session';
import { formatCOP } from '@/lib/utils';

export const metadata: Metadata = { title: 'Catálogo' };

/** HU-11/12/13 entry point: all products of a business, any state. */
export default async function ProductosNegocioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession('EMPRENDEDOR', 'ADMIN');
  const { id } = await params;
  const e = await loadOwned(id, getMyBusiness);
  const productos = await getMyBusinessProducts(e.id);

  const newBtn = (
    <Button asChild>
      <Link href={`/mi-negocio/${e.id}/productos/nuevo`}>
        <Plus aria-hidden /> Nuevo producto
      </Link>
    </Button>
  );

  return (
    <>
      <Link
        href="/mi-negocio"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Mis emprendimientos
      </Link>
      <PageHeader
        title={`Catálogo · ${e.nombre}`}
        subtitle="Productos y servicios de este emprendimiento"
        actions={productos.length > 0 && newBtn}
      />
      {productos.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Sin productos"
          description="Publica tu primer producto o servicio."
          action={newBtn}
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Producto</Th>
              <Th>Precio</Th>
              <Th>Stock</Th>
              <Th>Estado</Th>
              <Th className="text-right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <ProductImage src={p.imagenPrincipal} alt="" className="size-10 rounded-md" />
                    <span className="font-semibold">{p.nombre}</span>
                  </div>
                </Td>
                <Td>{formatCOP(p.precio)}</Td>
                <Td className={p.stockDisponible === 0 ? 'font-semibold text-danger' : ''}>
                  {p.stockDisponible}
                </Td>
                <Td>
                  <StatusBadge status={p.estado} />
                </Td>
                <Td>
                  <div className="flex justify-end gap-1.5">
                    <ProductStatusToggle productoId={p.id} estado={p.estado} />
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/mi-negocio/productos/${p.id}`}>
                        <Pencil aria-hidden /> Editar
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
