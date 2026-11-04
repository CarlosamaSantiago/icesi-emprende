/**
 * Emprende ICESI — PostgreSQL schema (ported 1:1 from the SID Spring/JPA entities).
 * Table and column names match the original so the legacy seed SQL runs unchanged.
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  customType,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const money = (name: string, precision = 12) => numeric(name, { precision, scale: 2, mode: 'number' });

// ---------------------------------------------------------------- identity
export const usuario = pgTable('usuario', {
  id: serial('id_usuario').primaryKey(),
  nombreCompleto: varchar('nombre_completo', { length: 255 }).notNull(),
  correoInstitucional: varchar('correo_institucional', { length: 255 }).notNull().unique(),
  programaAcademico: varchar('programa_academico', { length: 255 }).notNull(),
  semestreAcademico: integer('semestre_academico').notNull(),
  fotoPerfil: varchar('foto_perfil', { length: 500 }),
  clave: varchar('clave', { length: 255 }).notNull(),
});

export const rol = pgTable('rol', {
  id: serial('id_rol').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
});

export const permission = pgTable('permission', {
  id: serial('id_permission').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  descripcion: varchar('descripcion', { length: 255 }),
});

export const userRole = pgTable(
  'user_role',
  {
    usuarioId: integer('id_usuario')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    rolId: integer('id_rol')
      .notNull()
      .references(() => rol.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.usuarioId, t.rolId] })],
);

export const rolePermission = pgTable(
  'role_permission',
  {
    rolId: integer('id_rol')
      .notNull()
      .references(() => rol.id, { onDelete: 'cascade' }),
    permissionId: integer('id_permission')
      .notNull()
      .references(() => permission.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.rolId, t.permissionId] })],
);

// ---------------------------------------------------------------- catalogs
/** Shared status catalog: ACTIVO, INACTIVO, PENDIENTE, CONFIRMADO, PREPARANDO, ENTREGADO, CANCELADO */
export const estado = pgTable('estado', {
  id: serial('id_estado').primaryKey(),
  nombre: varchar('nombre', { length: 50 }).notNull().unique(),
});

export const semestre = pgTable('semestre', {
  id: serial('id_semestre').primaryKey(),
  periodo: varchar('periodo', { length: 20 }).notNull().unique(),
  fechaInicio: date('fecha_inicio').notNull(),
  fechaFin: date('fecha_fin').notNull(),
  estadoId: integer('id_estado')
    .notNull()
    .references(() => estado.id),
});

export const categoria = pgTable('categoria', {
  id: serial('id_categoria').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  descripcion: varchar('descripcion', { length: 255 }),
});

// ---------------------------------------------------------------- business
export const emprendimiento = pgTable(
  'emprendimiento',
  {
    id: serial('id_emprendimiento').primaryKey(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    descripcion: text('descripcion').notNull(),
    logoUrl: varchar('logo_url', { length: 500 }),
    destacado: boolean('destacado').notNull().default(false),
    usuarioId: integer('id_usuario')
      .notNull()
      .references(() => usuario.id),
    categoriaId: integer('id_categoria')
      .notNull()
      .references(() => categoria.id),
    semestreId: integer('id_semestre')
      .notNull()
      .references(() => semestre.id),
    estadoId: integer('id_estado')
      .notNull()
      .references(() => estado.id),
  },
  (t) => [
    index('idx_emprendimiento_usuario').on(t.usuarioId),
    index('idx_emprendimiento_categoria').on(t.categoriaId),
  ],
);

export const producto = pgTable(
  'producto',
  {
    id: serial('id_producto').primaryKey(),
    nombre: varchar('nombre', { length: 255 }).notNull(),
    descripcion: text('descripcion').notNull(),
    precio: money('precio', 10).notNull(),
    stockDisponible: integer('stock_disponible').notNull(),
    emprendimientoId: integer('id_emprendimiento')
      .notNull()
      .references(() => emprendimiento.id),
    estadoId: integer('id_estado')
      .notNull()
      .references(() => estado.id),
  },
  (t) => [index('idx_producto_emprendimiento').on(t.emprendimientoId)],
);

export const imagenProducto = pgTable('imagen_producto', {
  id: serial('id_imagen').primaryKey(),
  urlImagen: varchar('url_imagen', { length: 500 }).notNull(),
  productoId: integer('id_producto')
    .notNull()
    .references(() => producto.id, { onDelete: 'cascade' }),
});

export const pedido = pgTable(
  'pedido',
  {
    id: serial('id_pedido').primaryKey(),
    fechaPedido: timestamp('fecha_pedido', { withTimezone: false }).notNull().defaultNow(),
    total: money('total').notNull(),
    usuarioId: integer('id_usuario')
      .notNull()
      .references(() => usuario.id),
    emprendimientoId: integer('id_emprendimiento')
      .notNull()
      .references(() => emprendimiento.id),
    estadoId: integer('id_estado')
      .notNull()
      .references(() => estado.id),
  },
  (t) => [
    index('idx_pedido_usuario').on(t.usuarioId),
    index('idx_pedido_emprendimiento').on(t.emprendimientoId),
  ],
);

export const detallePedido = pgTable('detalle_pedido', {
  id: serial('id_detalle').primaryKey(),
  cantidad: integer('cantidad').notNull(),
  precioUnitario: money('precio_unitario', 10).notNull(),
  subtotal: money('subtotal').notNull(),
  pedidoId: integer('id_pedido')
    .notNull()
    .references(() => pedido.id, { onDelete: 'cascade' }),
  productoId: integer('id_producto')
    .notNull()
    .references(() => producto.id),
});

export const calificacion = pgTable('calificacion', {
  id: serial('id_calificacion').primaryKey(),
  puntuacion: integer('puntuacion').notNull(),
  comentario: text('comentario'),
  fecha: timestamp('fecha').notNull().defaultNow(),
  usuarioId: integer('id_usuario')
    .notNull()
    .references(() => usuario.id),
  emprendimientoId: integer('id_emprendimiento')
    .notNull()
    .references(() => emprendimiento.id),
  pedidoId: integer('id_pedido')
    .notNull()
    .references(() => pedido.id),
});

export const calificacionProducto = pgTable('calificacion_producto', {
  id: serial('id_calificacion_producto').primaryKey(),
  puntuacion: integer('puntuacion').notNull(),
  comentario: text('comentario'),
  fecha: timestamp('fecha').notNull().defaultNow(),
  usuarioId: integer('id_usuario')
    .notNull()
    .references(() => usuario.id),
  productoId: integer('id_producto')
    .notNull()
    .references(() => producto.id),
});

export const notificacion = pgTable(
  'notificacion',
  {
    id: serial('id_notificacion').primaryKey(),
    tipo: varchar('tipo', { length: 50 }).notNull(),
    contenido: text('contenido').notNull(),
    fecha: timestamp('fecha').notNull().defaultNow(),
    usuarioId: integer('id_usuario')
      .notNull()
      .references(() => usuario.id),
    referenciaId: integer('referencia_id'),
  },
  (t) => [index('idx_notificacion_usuario').on(t.usuarioId)],
);

export const mensaje = pgTable('mensaje', {
  id: serial('id_mensaje').primaryKey(),
  contenido: text('contenido').notNull(),
  fecha: timestamp('fecha').notNull().defaultNow(),
  remitenteId: integer('id_remitente')
    .notNull()
    .references(() => usuario.id),
  receptorId: integer('id_receptor')
    .notNull()
    .references(() => usuario.id),
  pedidoId: integer('id_pedido').references(() => pedido.id),
});

export const reporte = pgTable('reporte', {
  id: serial('id_reporte').primaryKey(),
  fechaGeneracion: timestamp('fecha_generacion').notNull().defaultNow(),
  periodo: varchar('periodo', { length: 50 }).notNull(),
  rutaArchivo: varchar('ruta_archivo', { length: 500 }),
  usuarioId: integer('id_usuario')
    .notNull()
    .references(() => usuario.id),
});

// ---------------------------------------------------------------- files (StorageService → Postgres implementation)
const bytea = customType<{ data: Buffer }>({ dataType: () => 'bytea' });

export const archivo = pgTable('archivo', {
  id: uuid('id_archivo').primaryKey().defaultRandom(),
  mime: varchar('mime', { length: 50 }).notNull(),
  tamano: integer('tamano').notNull(),
  datos: bytea('datos').notNull(),
  usuarioId: integer('id_usuario').references(() => usuario.id, { onDelete: 'set null' }),
  creadoEn: timestamp('creado_en').notNull().defaultNow(),
});

// ---------------------------------------------------------------- relations (for db.query.* joins)
export const usuarioRelations = relations(usuario, ({ many }) => ({
  roles: many(userRole),
  emprendimientos: many(emprendimiento),
  pedidos: many(pedido),
}));
export const rolRelations = relations(rol, ({ many }) => ({
  usuarios: many(userRole),
  permisos: many(rolePermission),
}));
export const permissionRelations = relations(permission, ({ many }) => ({ roles: many(rolePermission) }));
export const userRoleRelations = relations(userRole, ({ one }) => ({
  usuario: one(usuario, { fields: [userRole.usuarioId], references: [usuario.id] }),
  rol: one(rol, { fields: [userRole.rolId], references: [rol.id] }),
}));
export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  rol: one(rol, { fields: [rolePermission.rolId], references: [rol.id] }),
  permission: one(permission, { fields: [rolePermission.permissionId], references: [permission.id] }),
}));
export const categoriaRelations = relations(categoria, ({ many }) => ({
  emprendimientos: many(emprendimiento),
}));
export const emprendimientoRelations = relations(emprendimiento, ({ one, many }) => ({
  usuario: one(usuario, { fields: [emprendimiento.usuarioId], references: [usuario.id] }),
  categoria: one(categoria, { fields: [emprendimiento.categoriaId], references: [categoria.id] }),
  semestre: one(semestre, { fields: [emprendimiento.semestreId], references: [semestre.id] }),
  estado: one(estado, { fields: [emprendimiento.estadoId], references: [estado.id] }),
  productos: many(producto),
  pedidos: many(pedido),
  calificaciones: many(calificacion),
}));
export const productoRelations = relations(producto, ({ one, many }) => ({
  emprendimiento: one(emprendimiento, {
    fields: [producto.emprendimientoId],
    references: [emprendimiento.id],
  }),
  estado: one(estado, { fields: [producto.estadoId], references: [estado.id] }),
  imagenes: many(imagenProducto),
  calificaciones: many(calificacionProducto),
}));
export const imagenProductoRelations = relations(imagenProducto, ({ one }) => ({
  producto: one(producto, { fields: [imagenProducto.productoId], references: [producto.id] }),
}));
export const pedidoRelations = relations(pedido, ({ one, many }) => ({
  usuario: one(usuario, { fields: [pedido.usuarioId], references: [usuario.id] }),
  emprendimiento: one(emprendimiento, { fields: [pedido.emprendimientoId], references: [emprendimiento.id] }),
  estado: one(estado, { fields: [pedido.estadoId], references: [estado.id] }),
  detalles: many(detallePedido),
}));
export const detallePedidoRelations = relations(detallePedido, ({ one }) => ({
  pedido: one(pedido, { fields: [detallePedido.pedidoId], references: [pedido.id] }),
  producto: one(producto, { fields: [detallePedido.productoId], references: [producto.id] }),
}));
export const calificacionRelations = relations(calificacion, ({ one }) => ({
  usuario: one(usuario, { fields: [calificacion.usuarioId], references: [usuario.id] }),
  emprendimiento: one(emprendimiento, {
    fields: [calificacion.emprendimientoId],
    references: [emprendimiento.id],
  }),
  pedido: one(pedido, { fields: [calificacion.pedidoId], references: [pedido.id] }),
}));
export const calificacionProductoRelations = relations(calificacionProducto, ({ one }) => ({
  usuario: one(usuario, { fields: [calificacionProducto.usuarioId], references: [usuario.id] }),
  producto: one(producto, { fields: [calificacionProducto.productoId], references: [producto.id] }),
}));
export const notificacionRelations = relations(notificacion, ({ one }) => ({
  usuario: one(usuario, { fields: [notificacion.usuarioId], references: [usuario.id] }),
}));
