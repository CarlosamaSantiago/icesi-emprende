import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { type AuthUser, Role } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import {
  calificacion,
  calificacionProducto,
  detallePedido,
  emprendimiento,
  pedido,
  producto,
  usuario,
} from '../../database/schema.js';
import { EstadosService } from '../shared/estados.service.js';
import { notificar } from '../shared/notificar.js';
import type { CalificacionDto } from './calificaciones.dto.js';

/** "Ximena Gomez Ruiz" → "Ximena G." — reviews are public, so the full name is not exposed. */
export const autorCorto = (nombre: string) => {
  const [first, ...rest] = nombre.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[0][0].toUpperCase()}.` : first;
};

/** Average rounded to 1 decimal; `null` (never 0) when there are no ratings (HU-38 CA3). */
export function promedio(puntuaciones: number[]): number | null {
  if (puntuaciones.length === 0) return null;
  return Math.round((puntuaciones.reduce((s, p) => s + p, 0) / puntuaciones.length) * 10) / 10;
}

const isUniqueViolation = (e: unknown) =>
  ((e as { cause?: { code?: string } })?.cause?.code ?? (e as { code?: string })?.code) === '23505';

@Injectable()
export class CalificacionesService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly estados: EstadosService,
  ) {}

  // ------------------------------------------------------------------ emprendimiento (HU-37, HU-38)

  /** HU-38: average, count and comments of a business. Non-active businesses are only visible to owner/admin. */
  async resumenEmprendimiento(id: number, viewer?: AuthUser) {
    const [e] = await this.db
      .select({ ownerId: emprendimiento.usuarioId, estadoId: emprendimiento.estadoId })
      .from(emprendimiento)
      .where(eq(emprendimiento.id, id));
    const canSee = e && (e.estadoId === this.estados.id('ACTIVO') || this.isOwnerOrAdmin(e.ownerId, viewer));
    if (!canSee) throw new NotFoundException('Emprendimiento no encontrado');

    const rows = await this.db
      .select({
        id: calificacion.id,
        puntuacion: calificacion.puntuacion,
        comentario: calificacion.comentario,
        fecha: calificacion.fecha,
        autor: usuario.nombreCompleto,
      })
      .from(calificacion)
      .innerJoin(usuario, eq(calificacion.usuarioId, usuario.id))
      .where(eq(calificacion.emprendimientoId, id))
      .orderBy(desc(calificacion.fecha), desc(calificacion.id));

    return {
      promedio: promedio(rows.map((r) => r.puntuacion)),
      total: rows.length,
      items: rows.map(({ autor, ...r }) => ({ ...r, autor: autorCorto(autor) })),
    };
  }

  /** HU-37: only the buyer, only DELIVERED orders, only once per order (also enforced by a unique index). */
  async calificarPedido(user: AuthUser, pedidoId: number, dto: CalificacionDto) {
    const [p] = await this.db
      .select({
        id: pedido.id,
        buyerId: pedido.usuarioId,
        estadoId: pedido.estadoId,
        empId: emprendimiento.id,
        empNombre: emprendimiento.nombre,
        ownerId: emprendimiento.usuarioId,
      })
      .from(pedido)
      .innerJoin(emprendimiento, eq(pedido.emprendimientoId, emprendimiento.id))
      .where(eq(pedido.id, pedidoId));
    if (!p || p.buyerId !== user.id) throw new NotFoundException('Pedido no encontrado');
    if (p.estadoId !== this.estados.id('ENTREGADO'))
      throw new ConflictException('Solo puedes calificar pedidos entregados');

    try {
      return await this.db.transaction(async (tx) => {
        const [c] = await tx
          .insert(calificacion)
          .values({
            puntuacion: dto.puntuacion,
            comentario: dto.comentario ?? null,
            usuarioId: user.id,
            emprendimientoId: p.empId,
            pedidoId: p.id,
          })
          .returning({
            id: calificacion.id,
            puntuacion: calificacion.puntuacion,
            comentario: calificacion.comentario,
          });
        await notificar(tx, {
          usuarioId: p.ownerId,
          tipo: 'CALIFICACION',
          contenido: `Nueva reseña de ${dto.puntuacion} ${dto.puntuacion === 1 ? 'estrella' : 'estrellas'} en ${p.empNombre}`,
          referenciaId: p.empId,
        });
        return c;
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Este pedido ya fue calificado');
      throw e;
    }
  }

  // ------------------------------------------------------------------ productos (HU-39, HU-40)

  /** HU-39 CA3 (assumed rule, pending PO confirmation): buyer must have a DELIVERED order containing the product. */
  private async compro(userId: number, productoId: number) {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(detallePedido)
      .innerJoin(pedido, eq(detallePedido.pedidoId, pedido.id))
      .where(
        and(
          eq(pedido.usuarioId, userId),
          eq(pedido.estadoId, this.estados.id('ENTREGADO')),
          eq(detallePedido.productoId, productoId),
        ),
      );
    return row.n > 0;
  }

  private async productoVisible(id: number, viewer?: AuthUser) {
    const [p] = await this.db
      .select({
        estadoId: producto.estadoId,
        empEstadoId: emprendimiento.estadoId,
        ownerId: emprendimiento.usuarioId,
      })
      .from(producto)
      .innerJoin(emprendimiento, eq(producto.emprendimientoId, emprendimiento.id))
      .where(eq(producto.id, id));
    const activo = this.estados.id('ACTIVO');
    const isPublic = p && p.estadoId === activo && p.empEstadoId === activo;
    if (!p || (!isPublic && !this.isOwnerOrAdmin(p.ownerId, viewer)))
      throw new NotFoundException('Producto no encontrado');
    return p;
  }

  /** HU-39 CA2: ratings of one product, plus what the viewer can do (rate / edit). */
  async resumenProducto(id: number, viewer?: AuthUser) {
    const p = await this.productoVisible(id, viewer);
    const rows = await this.db
      .select({
        id: calificacionProducto.id,
        puntuacion: calificacionProducto.puntuacion,
        comentario: calificacionProducto.comentario,
        fecha: calificacionProducto.fecha,
        autor: usuario.nombreCompleto,
        usuarioId: calificacionProducto.usuarioId,
      })
      .from(calificacionProducto)
      .innerJoin(usuario, eq(calificacionProducto.usuarioId, usuario.id))
      .where(eq(calificacionProducto.productoId, id))
      .orderBy(desc(calificacionProducto.fecha), desc(calificacionProducto.id));

    const mine = viewer ? rows.find((r) => r.usuarioId === viewer.id) : undefined;
    const eligible = !!viewer && !mine && p.ownerId !== viewer.id && (await this.compro(viewer.id, id));
    return {
      promedio: promedio(rows.map((r) => r.puntuacion)),
      total: rows.length,
      items: rows.map(({ autor, usuarioId, ...r }) => ({
        ...r,
        autor: autorCorto(autor),
        esMia: usuarioId === viewer?.id,
      })),
      puedeCalificar: eligible,
    };
  }

  async calificarProducto(user: AuthUser, productoId: number, dto: CalificacionDto) {
    const p = await this.productoVisible(productoId, user);
    if (p.ownerId === user.id) throw new ConflictException('No puedes calificar tus propios productos');
    if (!(await this.compro(user.id, productoId)))
      throw new ConflictException('Solo puedes calificar productos de pedidos que ya recibiste');
    try {
      const [c] = await this.db
        .insert(calificacionProducto)
        .values({
          puntuacion: dto.puntuacion,
          comentario: dto.comentario ?? null,
          usuarioId: user.id,
          productoId,
        })
        .returning({ id: calificacionProducto.id });
      return c;
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Ya calificaste este producto');
      throw e;
    }
  }

  /** HU-40 CA1: the author's own product ratings. */
  misCalificacionesProducto(user: AuthUser) {
    return this.db
      .select({
        id: calificacionProducto.id,
        puntuacion: calificacionProducto.puntuacion,
        comentario: calificacionProducto.comentario,
        fecha: calificacionProducto.fecha,
        producto: { id: producto.id, nombre: producto.nombre },
        emprendimiento: { id: emprendimiento.id, nombre: emprendimiento.nombre },
      })
      .from(calificacionProducto)
      .innerJoin(producto, eq(calificacionProducto.productoId, producto.id))
      .innerJoin(emprendimiento, eq(producto.emprendimientoId, emprendimiento.id))
      .where(eq(calificacionProducto.usuarioId, user.id))
      .orderBy(desc(calificacionProducto.fecha), asc(calificacionProducto.id));
  }

  /** HU-40 CA3: only the author may edit/delete; the average is always derived, so a withdrawn rating leaves it at once. */
  private async ownRating(user: AuthUser, id: number) {
    const [c] = await this.db
      .select({ id: calificacionProducto.id, usuarioId: calificacionProducto.usuarioId })
      .from(calificacionProducto)
      .where(eq(calificacionProducto.id, id));
    if (!c) throw new NotFoundException('Calificación no encontrada');
    if (c.usuarioId !== user.id)
      throw new ForbiddenException('Solo el autor puede modificar su calificación');
  }

  async actualizarProducto(user: AuthUser, id: number, dto: CalificacionDto) {
    await this.ownRating(user, id);
    await this.db
      .update(calificacionProducto)
      .set({ puntuacion: dto.puntuacion, comentario: dto.comentario ?? null })
      .where(eq(calificacionProducto.id, id));
    return { id, puntuacion: dto.puntuacion, comentario: dto.comentario ?? null };
  }

  async eliminarProducto(user: AuthUser, id: number) {
    await this.ownRating(user, id);
    await this.db.delete(calificacionProducto).where(eq(calificacionProducto.id, id));
  }

  private isOwnerOrAdmin(ownerId: number, viewer?: AuthUser) {
    return !!viewer && (viewer.id === ownerId || viewer.roles.includes(Role.ADMIN));
  }
}
