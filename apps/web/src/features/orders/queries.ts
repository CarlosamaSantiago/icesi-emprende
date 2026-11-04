import 'server-only';
import { api } from '@/lib/api/client';
import type { Pedido } from '@/lib/api/types';

export const getMisCompras = () => api<Pedido[]>('/pedidos/mis-compras');
export const getPedidosRecibidos = () => api<Pedido[]>('/pedidos/recibidos');
