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
  /** HU-46: recognised as Emprendimiento del Mes this month. */
  delMes: boolean;
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
  /** HU-44: seller sees the breakdown, buyer only the status. */
  pago: PagoPedido | null;
  puedeRegistrarPago: boolean;
  /** HU-37 */
  calificacion: { puntuacion: number; comentario: string | null } | null;
  puedeCalificar: boolean;
}

export type EstadoPago = 'CONFIRMADO' | 'FALLIDO' | 'REEMBOLSADO';
export interface PagoPedido {
  estado: EstadoPago;
  monto?: number;
  comisionCiei?: number;
  costoPasarela?: number;
  referencia?: string | null;
}

// ------------------------------------------------------------------ HU-30..34 métricas
export interface Metricas {
  filtro: { desde: string | null; hasta: string | null; emprendimientoId: number | null };
  periodo: string;
  emprendimientos: { id: number; nombre: string }[];
  resumen: {
    totalPedidos: number;
    pedidosValidos: number;
    pedidosPendientes: number;
    pedidosCancelados: number;
    pedidosPagoFallido: number;
    ingresos: number;
    ingresosPendientes: number;
    ingresosCancelados: number;
    unidadesVendidas: number;
    ticketPromedio: number;
  };
  porEstado: { estado: EstadoPedido; cantidad: number }[];
  productos: {
    productoId: number;
    nombre: string;
    unidades: number;
    ingresos: number;
    participacion: number;
  }[];
  pedidos: {
    id: number;
    fecha: string;
    estado: EstadoPedido;
    total: number;
    comprador: string;
    emprendimiento: string;
    cuentaEnIngresos: boolean;
  }[];
}

// ------------------------------------------------------------------ HU-37..40 calificaciones
export interface ResumenCalificaciones {
  promedio: number | null;
  total: number;
  items: {
    id: number;
    puntuacion: number;
    comentario: string | null;
    fecha: string;
    autor: string;
    esMia?: boolean;
  }[];
  puedeCalificar?: boolean;
}
export interface MiCalificacionProducto {
  id: number;
  puntuacion: number;
  comentario: string | null;
  fecha: string;
  producto: { id: number; nombre: string };
  emprendimiento: { id: number; nombre: string };
}

// ------------------------------------------------------------------ HU-41/42 notificaciones
export interface Notificacion {
  id: number;
  tipo: 'PEDIDO' | 'CALIFICACION' | 'APROBACION' | 'RECONOCIMIENTO' | 'PAGO';
  contenido: string;
  fecha: string;
  referenciaId: number | null;
  leida: boolean;
}
export interface NotificacionesResponse {
  noLeidas: number;
  items: Notificacion[];
}

// ------------------------------------------------------------------ admin
export interface EmprendimientoAdmin extends EmprendimientoResumen {
  ultimaDecision: {
    decision: 'APROBADO' | 'RECHAZADO';
    motivo: string | null;
    fecha: string;
    admin: string | null;
  } | null;
}
export interface UsuarioAdmin {
  id: number;
  nombreCompleto: string;
  correo: string;
  programaAcademico: string;
  semestreAcademico: number;
  fotoPerfil: string | null;
  totalEmprendimientos: number;
  totalPedidos: number;
  roles: Role[];
}
export interface CategoriaAdmin extends Categoria {
  totalEmprendimientos: number;
}
export interface SemestreAdmin {
  id: number;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  emprendimientos: number;
  activos: number;
  ventas: number;
  pedidosValidos: number;
}
export interface RankingResponse {
  semestre: { id: number; periodo: string; fechaInicio: string; fechaFin: string };
  items: {
    posicion: number;
    emprendimientoId: number;
    nombre: string;
    categoria: string;
    propietario: string;
    ventas: number;
    pedidosValidos: number;
    unidades: number;
  }[];
}
export interface MesIndicador {
  mes: string;
  pedidosValidos: number;
  emprendimientosConActividad: number;
  gmv: number;
  comisionCiei: number;
  costoPasarela: number;
}
export interface IndicadoresResponse {
  desde: string;
  hasta: string;
  meses: MesIndicador[];
  totales: { pedidosValidos: number; gmv: number; comisionCiei: number; costoPasarela: number };
}
export interface PagosAdminResponse {
  totales: {
    pagosConfirmados: number;
    montoConfirmado: number;
    comisionCiei: number;
    costoPasarela: number;
    fallidos: number;
    reembolsados: number;
  };
  items: {
    id: number;
    pedidoId: number;
    fechaPedido: string;
    estado: EstadoPago;
    monto: number;
    comisionCiei: number;
    costoPasarela: number;
    referencia: string | null;
    emprendimiento: { id: number; nombre: string };
  }[];
}
export interface DelMesItem {
  id: number;
  periodo: string;
  emprendimientoId: number;
  emprendimiento: string;
  designadoPor: string | null;
  fecha: string;
}
export interface DelMesActual {
  periodo: string;
  emprendimiento: EmprendimientoResumen | null;
}
export interface PoliticaDatos {
  version: string;
  titulo: string;
  secciones: { titulo: string; texto: string }[];
}
