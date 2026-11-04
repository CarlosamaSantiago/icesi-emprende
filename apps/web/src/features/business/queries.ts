import 'server-only';
import { cache } from 'react';
import { api } from '@/lib/api/client';
import type { EmprendimientoResumen, ProductoDetalle, ProductoResumen } from '@/lib/api/types';

/** Owner-scoped endpoints: the API returns 404 for records the user does not own. */
export const getMyBusinesses = () => api<EmprendimientoResumen[]>('/mi-negocio/emprendimientos');
export const getMyBusiness = cache((id: number) =>
  api<EmprendimientoResumen>(`/mi-negocio/emprendimientos/${id}`),
);
export const getMyBusinessProducts = (id: number) =>
  api<ProductoResumen[]>(`/mi-negocio/emprendimientos/${id}/productos`);
export const getMyProduct = cache((id: number) => api<ProductoDetalle>(`/mi-negocio/productos/${id}`));
