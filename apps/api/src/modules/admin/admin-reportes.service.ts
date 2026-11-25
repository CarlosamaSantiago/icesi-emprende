import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { AuthUser } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import {
  categoria,
  emprendimiento,
  emprendimientoDelMes,
  estado,
  pago,
  pedido,
  semestre,
  usuario,
} from '../../database/schema.js';
import { periodoActual, sumarMeses } from '../shared/periodo.js';
import { EstadosService } from '../shared/estados.service.js';
import { notificar } from '../shared/notificar.js';
import { selectEmprendimientos, toEmprendimientoResumen } from '../shared/presenters.js';
import { pedidoValidoSql } from '../shared/sql.js';
import { completarMeses, ordenarRanking, type MesIndicador } from './admin.calc.js';
import type { DelMesDto } from './admin.dto.js';

const num = (e: ReturnType<typeof sql>) => e.mapWith(Number);

@Injectable()
export class AdminReportesService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly estados: EstadosService,
  ) {}

  /** HU-29 CA1: semesters with their businesses' headline numbers (valid sales only). */
  async semestres() {
    const rows = await this.db
      .select({
        id: semestre.id,
        periodo: semestre.periodo,
        fechaInicio: semestre.fechaInicio,
        fechaFin: semestre.fechaFin,
        emprendimientos: num(sql`count(distinct ${emprendimiento.id})`),
        activos: num(sql`count(distinct ${emprendimiento.id}) filter (where ${estado.nombre} = 'ACTIVO')`),
      })
      .from(semestre)
      .leftJoin(emprendimiento, eq(emprendimiento.semestreId, semestre.id))
      .leftJoin(estado, eq(emprendimiento.estadoId, estado.id))
      .groupBy(semestre.id)
      .orderBy(desc(semestre.fechaInicio));
    const ventas = await this.db
      .select({
        semestreId: emprendimiento.semestreId,
        ventas: num(sql`coalesce(sum(${pedido.total}) filter (where ${pedidoValidoSql}), 0)`),
        pedidos: num(sql`count(${pedido.id}) filter (where ${pedidoValidoSql})`),
      })
      .from(pedido)
      .innerJoin(emprendimiento, eq(pedido.emprendimientoId, emprendimiento.id))
      .innerJoin(estado, eq(pedido.estadoId, estado.id))
      .leftJoin(pago, eq(pago.pedidoId, pedido.id))
      .groupBy(emprendimiento.semestreId);
    const byS = new Map(ventas.map((v) => [v.semestreId, v]));
    return rows.map((s) => ({
      ...s,
      ventas: byS.get(s.id)?.ventas ?? 0,
      pedidosValidos: byS.get(s.id)?.pedidos ?? 0,
    }));
  }

  /** HU-29 CA2: businesses of one semester. */
  async emprendimientosDeSemestre(id: number) {
    const [s] = await this.db.select({ id: semestre.id }).from(semestre).where(eq(semestre.id, id));
    if (!s) throw new NotFoundException('Semestre no encontrado');
    const rows = await selectEmprendimientos(this.db, eq(emprendimiento.semestreId, id));
    return rows.map(toEmprendimientoResumen);
  }

  private async resolveSemestre(id?: number) {
    const [s] = await this.db
      .select()
      .from(semestre)
      .where(id ? eq(semestre.id, id) : undefined)
      .orderBy(desc(semestre.fechaInicio))
      .limit(1);
    if (!s) throw new NotFoundException('Semestre no encontrado');
    return s;
  }

  /** HU-35: ranking of a semester by valid sales (cancelled / refunded / failed-payment orders excluded). */
  async ranking(semestreId?: number) {
    const s = await this.resolveSemestre(semestreId);
    const rows = await this.db
      .select({
        emprendimientoId: emprendimiento.id,
        nombre: emprendimiento.nombre,
        categoria: categoria.nombre,
        propietario: usuario.nombreCompleto,
        ventas: num(sql`coalesce(sum(${pedido.total}) filter (where ${pedidoValidoSql}), 0)`),
        pedidosValidos: num(sql`count(${pedido.id}) filter (where ${pedidoValidoSql})`),
        unidades: num(
          sql`coalesce(sum((select sum(d.cantidad) from detalle_pedido d where d.id_pedido = ${pedido.id})) filter (where ${pedidoValidoSql}), 0)`,
        ),
      })
      .from(emprendimiento)
      .innerJoin(categoria, eq(emprendimiento.categoriaId, categoria.id))
      .innerJoin(usuario, eq(emprendimiento.usuarioId, usuario.id))
      .leftJoin(pedido, eq(pedido.emprendimientoId, emprendimiento.id))
      .leftJoin(estado, eq(pedido.estadoId, estado.id))
      .leftJoin(pago, eq(pago.pedidoId, pedido.id))
      .where(eq(emprendimiento.semestreId, s.id))
      .groupBy(emprendimiento.id, categoria.nombre, usuario.nombreCompleto);
    return {
      semestre: { id: s.id, periodo: s.periodo, fechaInicio: s.fechaInicio, fechaFin: s.fechaFin },
      items: ordenarRanking(rows),
    };
  }

  /**
   * HU-36: institutional indicators per month. GMV = valid sales; commission and gateway cost come from
   * the recorded payments (CONFIRMADO only), so they always reconcile with the payments report.
   */
  async indicadores(desde?: string, hasta?: string) {
    const fin = hasta ?? periodoActual();
    const ini = desde ?? sumarMeses(fin, -5);
    if (ini > fin) throw new BadRequestException('El mes inicial no puede ser posterior al final');
    if (sumarMeses(ini, 24) < fin) throw new BadRequestException('El rango máximo es de 25 meses');

    const mes = sql<string>`to_char(${pedido.fechaPedido}, 'YYYY-MM')`;
    const rows = await this.db
      .select({
        mes,
        pedidosValidos: num(sql`count(*)`),
        emprendimientosConActividad: num(sql`count(distinct ${pedido.emprendimientoId})`),
        gmv: num(sql`coalesce(sum(${pedido.total}), 0)`),
        comisionCiei: num(sql`coalesce(sum(${pago.comisionCiei}), 0)`),
        costoPasarela: num(sql`coalesce(sum(${pago.costoPasarela}), 0)`),
      })
      .from(pedido)
      .innerJoin(estado, eq(pedido.estadoId, estado.id))
      .leftJoin(pago, eq(pago.pedidoId, pedido.id))
      .where(
        and(
          pedidoValidoSql,
          gte(sql`to_char(${pedido.fechaPedido}, 'YYYY-MM')`, ini),
          lte(sql`to_char(${pedido.fechaPedido}, 'YYYY-MM')`, fin),
        ),
      )
      .groupBy(mes)
      .orderBy(asc(mes));
    const meses = completarMeses(ini, fin, rows as MesIndicador[]);
    const totales = meses.reduce(
      (t, m) => ({
        pedidosValidos: t.pedidosValidos + m.pedidosValidos,
        gmv: t.gmv + m.gmv,
        comisionCiei: t.comisionCiei + m.comisionCiei,
        costoPasarela: t.costoPasarela + m.costoPasarela,
      }),
      { pedidosValidos: 0, gmv: 0, comisionCiei: 0, costoPasarela: 0 },
    );
    return { desde: ini, hasta: fin, meses, totales };
  }

  // ------------------------------------------------------------------ HU-46
  async historialDelMes() {
    return this.db
      .select({
        id: emprendimientoDelMes.id,
        periodo: emprendimientoDelMes.periodo,
        emprendimientoId: emprendimiento.id,
        emprendimiento: emprendimiento.nombre,
        designadoPor: usuario.nombreCompleto,
        fecha: emprendimientoDelMes.creadoEn,
      })
      .from(emprendimientoDelMes)
      .innerJoin(emprendimiento, eq(emprendimientoDelMes.emprendimientoId, emprendimiento.id))
      .leftJoin(usuario, eq(emprendimientoDelMes.designadoPorId, usuario.id))
      .orderBy(desc(emprendimientoDelMes.periodo), desc(emprendimientoDelMes.id));
  }

  async designar(admin: AuthUser, { emprendimientoId, periodo }: DelMesDto) {
    const [e] = await this.db
      .select({
        estadoId: emprendimiento.estadoId,
        nombre: emprendimiento.nombre,
        ownerId: emprendimiento.usuarioId,
      })
      .from(emprendimiento)
      .where(eq(emprendimiento.id, emprendimientoId));
    if (!e) throw new NotFoundException('Emprendimiento no encontrado');
    if (this.estados.nombre(e.estadoId) !== 'ACTIVO')
      throw new ConflictException('Solo se puede reconocer a un emprendimiento activo');
    if (periodo < periodoActual())
      throw new BadRequestException('No se puede designar un mes que ya terminó');

    await this.db.transaction(async (tx) => {
      await tx.insert(emprendimientoDelMes).values({ emprendimientoId, periodo, designadoPorId: admin.id });
      await notificar(tx, {
        usuarioId: e.ownerId,
        tipo: 'RECONOCIMIENTO',
        contenido: `¡${e.nombre} es el Emprendimiento del Mes (${periodo})!`,
        referenciaId: emprendimientoId,
      });
    });
    return this.historialDelMes();
  }
}
