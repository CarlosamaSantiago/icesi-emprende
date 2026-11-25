import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, lt, sql, type SQL } from 'drizzle-orm';
import type { AuthUser } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import { emprendimiento, estado, pago, pedido } from '../../database/schema.js';
import type { MetricasQueryDto } from '../metricas/metricas.dto.js';
import { esFechaValida } from '../shared/periodo.js';
import { calcularPago, round } from '../shared/reglas.js';
import type { RegistrarPagoDto } from './pagos.dto.js';

/**
 * HU-44. Decision recorded for CA1 (pending PO confirmation): the platform does NOT charge anything; the seller
 * records the confirmation of a payment made outside it. Plugging a gateway later only changes who calls `registrar`.
 */
@Injectable()
export class PagosService {
  constructor(@InjectDb() private readonly db: Database) {}

  /** Owner-only. Creates or updates the single payment record of an order and (re)computes commission (CA2). */
  async registrar(user: AuthUser, pedidoId: number, dto: RegistrarPagoDto) {
    return this.db.transaction(async (tx) => {
      const [p] = await tx
        .select({ total: pedido.total, estado: estado.nombre, ownerId: emprendimiento.usuarioId })
        .from(pedido)
        .innerJoin(estado, eq(pedido.estadoId, estado.id))
        .innerJoin(emprendimiento, eq(pedido.emprendimientoId, emprendimiento.id))
        .where(eq(pedido.id, pedidoId))
        .for('update', { of: pedido }); // serialize with state changes / concurrent registrations
      if (!p || p.ownerId !== user.id) throw new NotFoundException('Pedido no encontrado');
      if (p.estado === 'CANCELADO')
        throw new ConflictException('No se registran pagos de pedidos cancelados');

      const [existing] = await tx.select().from(pago).where(eq(pago.pedidoId, pedidoId));
      if (existing?.estado === 'REEMBOLSADO')
        throw new ConflictException('El pago de este pedido fue reembolsado');

      const values = {
        estado: dto.estado,
        ...calcularPago(p.total, dto.estado),
        referencia: dto.referencia ?? null,
        registradoPorId: user.id,
        actualizadoEn: new Date(),
      };
      const [row] = existing
        ? await tx.update(pago).set(values).where(eq(pago.id, existing.id)).returning()
        : await tx
            .insert(pago)
            .values({ pedidoId, ...values })
            .returning();
      return row;
    });
  }

  /** Admin (CIEI finance): every payment with institutional totals. Only CONFIRMADO payments add up as revenue (CA3). */
  async listarAdmin(q: MetricasQueryDto) {
    if (q.desde && !esFechaValida(q.desde)) throw new BadRequestException('La fecha inicial no es válida');
    if (q.hasta && !esFechaValida(q.hasta)) throw new BadRequestException('La fecha final no es válida');
    if (q.desde && q.hasta && q.desde > q.hasta)
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');

    const where: (SQL | undefined)[] = [];
    if (q.desde) where.push(gte(pedido.fechaPedido, sql`${q.desde}::date`));
    if (q.hasta) where.push(lt(pedido.fechaPedido, sql`(${q.hasta}::date + 1)`));

    const items = await this.db
      .select({
        id: pago.id,
        pedidoId: pago.pedidoId,
        fechaPedido: pedido.fechaPedido,
        estado: pago.estado,
        monto: pago.monto,
        comisionCiei: pago.comisionCiei,
        costoPasarela: pago.costoPasarela,
        referencia: pago.referencia,
        actualizadoEn: pago.actualizadoEn,
        emprendimiento: { id: emprendimiento.id, nombre: emprendimiento.nombre },
      })
      .from(pago)
      .innerJoin(pedido, eq(pago.pedidoId, pedido.id))
      .innerJoin(emprendimiento, eq(pedido.emprendimientoId, emprendimiento.id))
      .where(and(...where))
      .orderBy(desc(pedido.fechaPedido), desc(pago.id));

    const confirmados = items.filter((i) => i.estado === 'CONFIRMADO');
    const sum = (xs: number[]) => round(xs.reduce((s, x) => s + x, 0));
    return {
      totales: {
        pagosConfirmados: confirmados.length,
        montoConfirmado: sum(confirmados.map((i) => i.monto)),
        comisionCiei: sum(confirmados.map((i) => i.comisionCiei)),
        costoPasarela: sum(confirmados.map((i) => i.costoPasarela)),
        fallidos: items.filter((i) => i.estado === 'FALLIDO').length,
        reembolsados: items.filter((i) => i.estado === 'REEMBOLSADO').length,
      },
      items,
    };
  }
}
