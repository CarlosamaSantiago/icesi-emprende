import 'server-only';
import { cache } from 'react';
import { api } from '@/lib/api/client';
import type {
  Categoria,
  EmprendimientoDetalle,
  EmprendimientoResumen,
  Paginated,
  ProductoDetalle,
  ProductoResumen,
} from '@/lib/api/types';

export interface CatalogFilters {
  q?: string;
  categoriaId?: number;
  page?: number;
}

export const getCategorias = cache(() => api<Categoria[]>('/categorias', { auth: false }));

export const getCatalog = (f: CatalogFilters) =>
  api<Paginated<ProductoResumen>>('/marketplace/productos', {
    query: { q: f.q, categoriaId: f.categoriaId, page: f.page },
  });

export const getDestacados = () => api<EmprendimientoResumen[]>('/marketplace/destacados');

/** Sends the session (if any) so owners/admins can preview non-public records. */
export const getEmprendimiento = cache((id: number) => api<EmprendimientoDetalle>(`/emprendimientos/${id}`));
export const getProducto = cache((id: number) => api<ProductoDetalle>(`/productos/${id}`));
