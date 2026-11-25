import 'server-only';
import { api } from '@/lib/api/client';
import type { MiCalificacionProducto, ResumenCalificaciones } from '@/lib/api/types';

export const getCalificacionesEmprendimiento = (id: number) =>
  api<ResumenCalificaciones>(`/emprendimientos/${id}/calificaciones`);
export const getCalificacionesProducto = (id: number) =>
  api<ResumenCalificaciones>(`/productos/${id}/calificaciones`);
export const getMisCalificaciones = () => api<MiCalificacionProducto[]>('/calificaciones-producto/mias');
