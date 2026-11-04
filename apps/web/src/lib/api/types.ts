/**
 * API contract — response shapes returned by apps/api.
 * Keep in sync with the API services (they return exactly these shapes).
 */

export type Role = 'ADMIN' | 'EMPRENDEDOR' | 'COMPRADOR';
export type EstadoVisibilidad = 'ACTIVO' | 'INACTIVO' | 'PENDIENTE';
export type EstadoPedido = 'PENDIENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'ENTREGADO' | 'CANCELADO';

export interface SessionUser {
  id: number;
  email: string;
  nombre: string;
  roles: Role[];
}

export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
}

export interface Perfil {
  id: number;
  nombreCompleto: string;
  correoInstitucional: string;
  programaAcademico: string;
  semestreAcademico: number;
  fotoPerfil: string | null;
  roles: Role[];
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface EmprendimientoResumen {
  id: number;
  nombre: string;
  descripcion: string;
  logoUrl: string | null;
  destacado: boolean;
  estado: EstadoVisibilidad;
  categoria: { id: number; nombre: string };
  semestre: { id: number; periodo: string };
  propietario: { id: number; nombreCompleto: string };
  totalProductos: number;
}

export interface ProductoResumen {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stockDisponible: number;
  estado: EstadoVisibilidad;
  imagenPrincipal: string | null;
  emprendimiento: { id: number; nombre: string; categoria: string };
}

export interface ProductoDetalle extends ProductoResumen {
  imagenes: { id: number; url: string }[];
}

export interface EmprendimientoDetalle extends EmprendimientoResumen {
  productos: ProductoResumen[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Pedido {
  id: number;
  fechaPedido: string;
  total: number;
  estado: EstadoPedido;
  emprendimiento: { id: number; nombre: string };
  comprador: { id: number; nombreCompleto: string; correo: string };
  detalles: {
    id: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    producto: { id: number; nombre: string };
  }[];
  /** Next states the current user may move this order to (computed by the API). */
  transicionesPermitidas: EstadoPedido[];
}
