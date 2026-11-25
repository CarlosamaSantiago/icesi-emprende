import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lt, sql, type SQL } from 'drizzle-orm';
import type { AuthUser } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import {
  detallePedido,
  emprendimiento,
  estado,
  pago,
  pedido,
  producto,
  reporte,
  usuario,
} from '../../database/schema.js';
import type { EstadoPedido } from '../pedidos/pedido-state.js';
import { esFechaValida } from '../shared/periodo.js';
import { buildCsv } from './csv.js';
import { computeMetricas, type LineaPedido } from './metricas.calc.js';
import type { MetricasQueryDto } from './metricas.dto.js';
import { buildMetricasPdf } from './pdf.js';

const dmy = (iso: string) => iso.split('-').reverse().join('/');

/** "Todo el historial" / "Del 01/11/2026 al 30/11/2026" / "Desde … " / "Hasta …" */
export function describePeriodo(desde?: string, hasta?: string) {
  if (desde && hasta) return `Del ${dmy(desde)} al ${dmy(hasta)}`;
  if (desde) return `Desde el ${dmy(desde)}`;
  if (hasta) return `Hasta el ${dmy(hasta)}`;
  return 'Todo el historial';
}

@Injectable()
export class MetricasService {
  constructor(@InjectDb() private readonly db: Database) {}

  /** HU-32 CA3: invalid ranges are reported, never silently ignored. */
  private validarFiltro({ desde, hasta }: MetricasQueryDto) {
    if (desde && !esFechaValida(desde))
      throw new BadRequestException('La fecha inicial no es una fecha válida');
    if (hasta && !esFechaValida(hasta))
      throw new BadRequestException('La fecha final no es una fecha válida');
    if (desde && hasta && desde > hasta)
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');
  }

  /** Only the caller's own businesses (HU-30 CA2); optionally one of them. */
  private async lineas(user: AuthUser, q: MetricasQueryDto): Promise<LineaPedido[]> {
    this.validarFiltro(q);
    const where: (SQL | undefined)[] = [eq(emprendimiento.usuarioId, user.id)];
    if (q.emprendimientoId) where.push(eq(emprendimiento.id, q.emprendimientoId));
    if (q.desde) where.push(gte(pedido.fechaPedido, sql`${q.desde}::date`));
    if (q.hasta) where.push(lt(pedido.fechaPedido, sql`(${q.hasta}::date + 1)`)); // inclusive end day

    const rows = await this.db
      .select({
        pedidoId: pedido.id,
        fecha: pedido.fechaPedido,
        estado: estado.nombre,
        pagoEstado: pago.estado,
        totalPedido: pedido.total,
        comprador: usuario.nombreCompleto,
        emprendimiento: emprendimiento.nombre,
        productoId: producto.id,
        producto: producto.nombre,
        cantidad: detallePedido.cantidad,
        precioUnitario: detallePedido.precioUnitario,
        subtotal: detallePedido.subtotal,
      })
      .from(detallePedido)
      .innerJoin(pedido, eq(detallePedido.pedidoId, pedido.id))
      .innerJoin(estado, eq(pedido.estadoId, estado.id))
      .innerJoin(emprendimiento, eq(pedido.emprendimientoId, emprendimiento.id))
      .innerJoin(usuario, eq(pedido.usuarioId, usuario.id))
      .innerJoin(producto, eq(detallePedido.productoId, producto.id))
      .leftJoin(pago, eq(pago.pedidoId, pedido.id))
      .where(and(...where));
    return rows.map((r) => ({ ...r, estado: r.estado as EstadoPedido }));
  }

  private misEmprendimientos(userId: number) {
    return this.db
      .select({ id: emprendimiento.id, nombre: emprendimiento.nombre })
      .from(emprendimiento)
      .where(eq(emprendimiento.usuarioId, userId))
      .orderBy(emprendimiento.nombre);
  }

  /** HU-30/31/32 */
  async obtener(user: AuthUser, q: MetricasQueryDto) {
    const [lineas, emprendimientos] = await Promise.all([
      this.lineas(user, q),
      this.misEmprendimientos(user.id),
    ]);
    if (q.emprendimientoId && !emprendimientos.some((e) => e.id === q.emprendimientoId))
      throw new NotFoundException('Emprendimiento no encontrado');
    return {
      filtro: {
        desde: q.desde ?? null,
        hasta: q.hasta ?? null,
        emprendimientoId: q.emprendimientoId ?? null,
      },
      periodo: describePeriodo(q.desde, q.hasta),
      emprendimientos,
      ...computeMetricas(lineas),
    };
  }

  /** HU-33 */
  async pdf(user: AuthUser, q: MetricasQueryDto) {
    const lineas = await this.lineas(user, q);
    const periodo = describePeriodo(q.desde, q.hasta);
    const [u] = await this.db
      .select({ nombre: usuario.nombreCompleto, correo: usuario.correoInstitucional })
      .from(usuario)
      .where(eq(usuario.id, user.id));
    const buffer = await buildMetricasPdf({
      emprendedor: u.nombre,
      correo: u.correo,
      periodo,
      metricas: computeMetricas(lineas),
    });
    await this.db.insert(reporte).values({ usuarioId: user.id, periodo: periodo.slice(0, 50) });
    return buffer;
  }

  /** HU-34 */
  async csv(user: AuthUser, q: MetricasQueryDto) {
    return buildCsv(await this.lineas(user, q));
  }
}
