import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import type { AuthUser } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import {
  detallePedido,
  emprendimiento,
  notificacion,
  pago,
  pedido,
  producto,
} from '../../database/schema.js';
import { notificar } from '../shared/notificar.js';
import { EstadosService } from '../shared/estados.service.js';
import {
  allowedTransitions,
  canTransition,
  deductsStock,
  type EstadoPedido,
  restoresStock,
} from './pedido-state.js';
import { CheckoutDto, UpdateEstadoPedidoDto } from './pedidos.dto.js';

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];
const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class PedidosService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly estados: EstadosService,
  ) {}

  /**
   * HU-20: validates every line against current DB state, then creates one PENDIENTE order per business
   * in a single transaction. Any invalid line aborts everything (no partial / misleading orders).
   */
  async checkout(buyer: AuthUser, dto: CheckoutDto) {
    const qty = new Map<number, number>();
    for (const it of dto.items) qty.set(it.productoId, (qty.get(it.productoId) ?? 0) + it.cantidad);
    const activo = this.estados.id('ACTIVO');

    const ids = await this.db.transaction(async (tx) => {
      const rows = await tx
        .select({
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          stock: producto.stockDisponible,
          estadoId: producto.estadoId,
          empId: emprendimiento.id,
          empNombre: emprendimiento.nombre,
          empEstadoId: emprendimiento.estadoId,
          ownerId: emprendimiento.usuarioId,
        })
        .from(producto)
        .innerJoin(emprendimiento, eq(producto.emprendimientoId, emprendimiento.id))
        .where(inArray(producto.id, [...qty.keys()]))
        .for('update', { of: producto }); // lock rows: consistent stock check under concurrency

      if (rows.length !== qty.size) throw new BadRequestException('Uno de los productos ya no existe');
      for (const r of rows) {
        const wanted = qty.get(r.id)!;
        if (r.estadoId !== activo || r.empEstadoId !== activo)
          throw new ConflictException(`"${r.nombre}" ya no está disponible`);
        if (r.ownerId === buyer.id)
          throw new BadRequestException(`No puedes comprar en tu propio emprendimiento (${r.empNombre})`);
        if (wanted > r.stock)
          throw new ConflictException(`"${r.nombre}": solo hay ${r.stock} unidades disponibles`);
      }

      const byBusiness = Map.groupBy(rows, (r) => r.empId);
      const created: number[] = [];
      for (const [empId, lines] of byBusiness) {
        const total = round2(lines.reduce((s, l) => s + l.precio * qty.get(l.id)!, 0));
        const [p] = await tx
          .insert(pedido)
          .values({
            usuarioId: buyer.id,
            emprendimientoId: empId,
            estadoId: this.estados.id('PENDIENTE'),
            total,
          })
          .returning({ id: pedido.id });
        await tx.insert(detallePedido).values(
          lines.map((l) => ({
            pedidoId: p.id,
            productoId: l.id,
            cantidad: qty.get(l.id)!,
            precioUnitario: l.precio,
            subtotal: round2(l.precio * qty.get(l.id)!),
          })),
        );
        await tx.insert(notificacion).values({
          usuarioId: lines[0].ownerId,
          tipo: 'PEDIDO',
          contenido: `Nuevo pedido #${p.id} en ${lines[0].empNombre}`,
          referenciaId: p.id,
        });
        created.push(p.id);
      }
      return created;
    });

    return this.load(inArray(pedido.id, ids), buyer.id);
  }

  /** HU-21: only the buyer's own orders. */
  misCompras(user: AuthUser) {
    return this.load(eq(pedido.usuarioId, user.id), user.id);
  }

  /** HU-22: only orders of businesses owned by the user (CA3). */
  recibidos(user: AuthUser) {
    const own = this.db
      .select({ id: emprendimiento.id })
      .from(emprendimiento)
      .where(eq(emprendimiento.usuarioId, user.id));
    return this.load(inArray(pedido.emprendimientoId, own), user.id);
  }

  /**
   * HU-23: owner-only, validated transition, applied with optimistic concurrency
   * (`WHERE estado = <current>`), so two concurrent clicks can never deduct/restore stock twice.
   */
  async updateEstado(user: AuthUser, id: number, { estado: to }: UpdateEstadoPedidoDto) {
    await this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          estadoId: pedido.estadoId,
          ownerId: emprendimiento.usuarioId,
          buyerId: pedido.usuarioId,
          empNombre: emprendimiento.nombre,
        })
        .from(pedido)
        .innerJoin(emprendimiento, eq(pedido.emprendimientoId, emprendimiento.id))
        .where(eq(pedido.id, id));
      if (!row || row.ownerId !== user.id) throw new NotFoundException('Pedido no encontrado');

      const from = this.estados.nombre(row.estadoId) as EstadoPedido;
      if (!canTransition(from, to)) throw new BadRequestException(`No se puede pasar de ${from} a ${to}`);

      const updated = await tx
        .update(pedido)
        .set({ estadoId: this.estados.id(to) })
        .where(and(eq(pedido.id, id), eq(pedido.estadoId, row.estadoId)))
        .returning({ id: pedido.id });
      if (updated.length === 0)
        throw new ConflictException('El pedido cambió mientras lo actualizabas. Recarga la página.');

      if (deductsStock(from, to)) await this.adjustStock(tx, id, -1);
      if (restoresStock(from, to)) await this.adjustStock(tx, id, +1);

      // HU-44 CA3: a cancelled order can no longer count as paid revenue. Amounts are kept for audit;
      // reports only add up CONFIRMADO payments.
      if (to === 'CANCELADO') {
        await tx
          .update(pago)
          .set({ estado: 'REEMBOLSADO', actualizadoEn: new Date() })
          .where(and(eq(pago.pedidoId, id), eq(pago.estado, 'CONFIRMADO')));
      }

      // Keep the buyer informed (visible in their notification bell).
      await notificar(tx, {
        usuarioId: row.buyerId,
        tipo: 'PEDIDO',
        contenido: `Tu pedido #${id} en ${row.empNombre} ahora está ${to.toLowerCase()}`,
        referenciaId: id,
      });
    });

    const [result] = await this.load(eq(pedido.id, id), user.id);
    return result;
  }

  /** sign −1 = deduct (fails if not enough stock), +1 = restore. */
  private async adjustStock(tx: Tx, pedidoId: number, sign: 1 | -1) {
    const lines = await tx.select().from(detallePedido).where(eq(detallePedido.pedidoId, pedidoId));
    for (const l of lines) {
      const res = await tx
        .update(producto)
        .set({ stockDisponible: sql`${producto.stockDisponible} + ${sign * l.cantidad}` })
        .where(
          sign < 0
            ? and(eq(producto.id, l.productoId), gte(producto.stockDisponible, l.cantidad))
            : eq(producto.id, l.productoId),
        )
        .returning({ id: producto.id });
      if (res.length === 0)
        throw new ConflictException('No hay existencias suficientes para confirmar este pedido');
    }
  }

  private async load(where: ReturnType<typeof eq>, viewerId: number) {
    const rows = await this.db.query.pedido.findMany({
      where,
      orderBy: desc(pedido.fechaPedido),
      with: {
        emprendimiento: { columns: { id: true, nombre: true, usuarioId: true } },
        usuario: { columns: { id: true, nombreCompleto: true, correoInstitucional: true } },
        detalles: { with: { producto: { columns: { id: true, nombre: true } } } },
        pago: true,
        calificacion: { columns: { puntuacion: true, comentario: true } },
      },
    });
    return rows.map((p) => {
      const estado = this.estados.nombre(p.estadoId) as EstadoPedido;
      const isSeller = p.emprendimiento.usuarioId === viewerId;
      const isBuyer = p.usuario.id === viewerId;
      return {
        id: p.id,
        fechaPedido: p.fechaPedido,
        total: p.total,
        estado,
        emprendimiento: { id: p.emprendimiento.id, nombre: p.emprendimiento.nombre },
        comprador: {
          id: p.usuario.id,
          nombreCompleto: p.usuario.nombreCompleto,
          correo: p.usuario.correoInstitucional,
        },
        detalles: p.detalles.map((d) => ({
          id: d.id,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal,
          producto: d.producto,
        })),
        transicionesPermitidas: isSeller ? allowedTransitions(estado) : [],
        // HU-44: the seller sees the financial breakdown; the buyer only sees the payment status.
        pago: p.pago
          ? isSeller
            ? {
                estado: p.pago.estado,
                monto: p.pago.monto,
                comisionCiei: p.pago.comisionCiei,
                costoPasarela: p.pago.costoPasarela,
                referencia: p.pago.referencia,
              }
            : { estado: p.pago.estado }
          : null,
        puedeRegistrarPago: isSeller && estado !== 'CANCELADO' && p.pago?.estado !== 'REEMBOLSADO',
        // HU-37: rating is offered to the buyer of a delivered order that has not been rated yet.
        calificacion: p.calificacion ?? null,
        puedeCalificar: isBuyer && estado === 'ENTREGADO' && !p.calificacion,
      };
    });
  }
}
