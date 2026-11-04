import { SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { Pagination } from '@/components/ui/pagination';
import { BusinessCard } from '@/features/marketplace/components/business-card';
import { CatalogFilters } from '@/features/marketplace/components/catalog-filters';
import { ProductCard } from '@/features/marketplace/components/product-card';
import { getCatalog, getCategorias, getDestacados } from '@/features/marketplace/queries';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Marketplace' };

type Search = { q?: string; categoria?: string; page?: string };

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const categoriaId = Number(sp.categoria) || undefined;
  const filtering = !!(sp.q || categoriaId);

  const [session, categorias, catalog, destacados] = await Promise.all([
    getSession(),
    getCategorias(),
    getCatalog({ q: sp.q, categoriaId, page }),
    filtering ? Promise.resolve([]) : getDestacados(),
  ]);

  const hrefFor = (p: number) => {
    const qs = new URLSearchParams({
      ...(sp.q && { q: sp.q }),
      ...(categoriaId && { categoria: String(categoriaId) }),
      page: String(p),
    });
    return `/marketplace?${qs}`;
  };

  return (
    <>
      <PageHeader title="Marketplace" subtitle="Productos y servicios de la comunidad emprendedora Icesi" />

      {destacados.length > 0 && (
        <section aria-labelledby="destacados" className="mb-8">
          <h2 id="destacados" className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
            Emprendimientos destacados
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {destacados.map((e) => (
              <BusinessCard key={e.id} emprendimiento={e} />
            ))}
          </div>
        </section>
      )}

      <CatalogFilters categorias={categorias} />

      {catalog.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No encontramos resultados"
          description={
            filtering ? 'Prueba con otro término o limpia los filtros.' : 'Aún no hay productos publicados.'
          }
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">{catalog.total} resultados</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.items.map((p) => (
              <ProductCard key={p.id} producto={p} authenticated={!!session} />
            ))}
          </div>
          <Pagination
            page={catalog.page}
            total={catalog.total}
            pageSize={catalog.pageSize}
            hrefFor={hrefFor}
          />
        </>
      )}
    </>
  );
}
