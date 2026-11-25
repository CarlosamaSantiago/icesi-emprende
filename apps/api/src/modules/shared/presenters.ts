/**
 * Read models shared by several modules. They produce exactly the shapes documented in
 * apps/web/src/lib/api/types.ts (the API contract).
 */
import { and, asc, eq, type SQL, sql } from 'drizzle-orm';
import type { Database } from '../../database/database.module.js';
import {
  categoria,
  emprendimiento,
  estado,
  imagenProducto,
  producto,
  semestre,
  usuario,
} from '../../database/schema.js';
import { periodoActual } from './periodo.js';

// ------------------------------------------------------------------ emprendimiento
/** Built per call because "Emprendimiento del Mes" depends on the current month. */
const emprendimientoColumns = () => ({
  id: emprendimiento.id,
  nombre: emprendimiento.nombre,
  descripcion: emprendimiento.descripcion,
  logoUrl: emprendimiento.logoUrl,
  destacado: emprendimiento.destacado,
  usuarioId: emprendimiento.usuarioId,
  estado: estado.nombre,
  categoriaId: categoria.id,
  categoriaNombre: categoria.nombre,
  semestreId: semestre.id,
  semestrePeriodo: semestre.periodo,
  propietarioNombre: usuario.nombreCompleto,
  totalProductos:
    sql<number>`(select count(*) from ${producto} where ${producto.emprendimientoId} = ${emprendimiento.id})`.mapWith(
      Number,
    ),
  /** HU-46 CA2: true when the latest designation of the current month points to this business. */
  delMes: sql<boolean>`exists (
    select 1 from emprendimiento_del_mes m
    where m.id_emprendimiento = ${emprendimiento.id}
      and m.periodo = ${periodoActual()}
      and m.id_designacion = (select max(m2.id_designacion) from emprendimiento_del_mes m2 where m2.periodo = m.periodo)
  )`.mapWith(Boolean),
});

export type EmprendimientoRow = Awaited<ReturnType<typeof selectEmprendimientos>>[number];

export function selectEmprendimientos(db: Database, where?: SQL) {
  return db
    .select(emprendimientoColumns())
    .from(emprendimiento)
    .innerJoin(estado, eq(emprendimiento.estadoId, estado.id))
    .innerJoin(categoria, eq(emprendimiento.categoriaId, categoria.id))
    .innerJoin(semestre, eq(emprendimiento.semestreId, semestre.id))
    .innerJoin(usuario, eq(emprendimiento.usuarioId, usuario.id))
    .where(where)
    .orderBy(asc(emprendimiento.nombre));
}

export function toEmprendimientoResumen(r: EmprendimientoRow) {
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    logoUrl: r.logoUrl,
    destacado: r.destacado,
    delMes: r.delMes,
    estado: r.estado,
    categoria: { id: r.categoriaId, nombre: r.categoriaNombre },
    semestre: { id: r.semestreId, periodo: r.semestrePeriodo },
    propietario: { id: r.usuarioId, nombreCompleto: r.propietarioNombre },
    totalProductos: r.totalProductos,
  };
}

// ------------------------------------------------------------------ producto
const empEstado = sql`(select e.nombre from ${estado} e where e.id_estado = ${emprendimiento.estadoId})`;

const productoColumns = {
  id: producto.id,
  nombre: producto.nombre,
  descripcion: producto.descripcion,
  precio: producto.precio,
  stockDisponible: producto.stockDisponible,
  estado: estado.nombre,
  imagenPrincipal: sql<
    string | null
  >`(select ${imagenProducto.urlImagen} from ${imagenProducto} where ${imagenProducto.productoId} = ${producto.id} order by ${imagenProducto.id} limit 1)`,
  emprendimientoId: emprendimiento.id,
  emprendimientoNombre: emprendimiento.nombre,
  emprendimientoEstado: empEstado.mapWith(String),
  propietarioId: emprendimiento.usuarioId,
  categoriaNombre: categoria.nombre,
};

export type ProductoRow = Awaited<ReturnType<typeof selectProductosQuery>>[number];

function selectProductosQuery(db: Database) {
  return db
    .select(productoColumns)
    .from(producto)
    .innerJoin(estado, eq(producto.estadoId, estado.id))
    .innerJoin(emprendimiento, eq(producto.emprendimientoId, emprendimiento.id))
    .innerJoin(categoria, eq(emprendimiento.categoriaId, categoria.id));
}

export function selectProductos(db: Database, where?: SQL) {
  return selectProductosQuery(db).where(where).orderBy(asc(producto.nombre)).$dynamic();
}

export function toProductoResumen(r: ProductoRow) {
  return {
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    precio: r.precio,
    stockDisponible: r.stockDisponible,
    estado: r.estado,
    imagenPrincipal: r.imagenPrincipal,
    emprendimiento: { id: r.emprendimientoId, nombre: r.emprendimientoNombre, categoria: r.categoriaNombre },
  };
}

export async function productoDetalle(db: Database, row: ProductoRow) {
  const imagenes = await db
    .select({ id: imagenProducto.id, url: imagenProducto.urlImagen })
    .from(imagenProducto)
    .where(eq(imagenProducto.productoId, row.id))
    .orderBy(asc(imagenProducto.id));
  return { ...toProductoResumen(row), imagenes };
}

/** Public visibility rule (HU-09 CA3, HU-13 CA3, HU-15 CA2). */
export const productoPublico = (activoId: number) =>
  and(eq(producto.estadoId, activoId), eq(emprendimiento.estadoId, activoId));
