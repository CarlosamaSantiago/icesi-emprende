import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { AuthUser } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import { aprobacionEmprendimiento, emprendimiento, usuario } from '../../database/schema.js';
import { EstadosService } from '../shared/estados.service.js';
import { notificar } from '../shared/notificar.js';
import { selectEmprendimientos, toEmprendimientoResumen } from '../shared/presenters.js';
import { DecisionDto, DestacadoDto, VisibilidadDto } from './admin.dto.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly estados: EstadosService,
  ) {}

  /** Latest approval decision per business (HU-43 CA2): `distinct on` keeps the row with the highest id. */
  private latestDecisions() {
    return this.db
      .selectDistinctOn([aprobacionEmprendimiento.emprendimientoId], {
        emprendimientoId: aprobacionEmprendimiento.emprendimientoId,
        decision: aprobacionEmprendimiento.decision,
        motivo: aprobacionEmprendimiento.motivo,
        fecha: aprobacionEmprendimiento.fecha,
        admin: usuario.nombreCompleto,
      })
      .from(aprobacionEmprendimiento)
      .leftJoin(usuario, eq(aprobacionEmprendimiento.adminId, usuario.id))
      .orderBy(aprobacionEmprendimiento.emprendimientoId, desc(aprobacionEmprendimiento.id));
  }

  /** HU-09 CA1 + HU-43 CA1: every business with its state and its latest review decision. */
  async list() {
    const [rows, decisions] = await Promise.all([selectEmprendimientos(this.db), this.latestDecisions()]);
    const byId = new Map(decisions.map((d) => [d.emprendimientoId, d]));
    return rows.map((r) => {
      const d = byId.get(r.id);
      return {
        ...toEmprendimientoResumen(r),
        ultimaDecision: d ? { decision: d.decision, motivo: d.motivo, fecha: d.fecha, admin: d.admin } : null,
      };
    });
  }

  /**
   * HU-09 CA2 + HU-43 CA3: activating/deactivating is NOT a substitute for the approval flow.
   * A business awaiting review, or one that was rejected, can only be activated through `decidir`.
   */
  async setVisibilidad(id: number, { estado }: VisibilidadDto) {
    const [current] = await selectEmprendimientos(this.db, eq(emprendimiento.id, id));
    if (!current) throw new NotFoundException('Emprendimiento no encontrado');
    if (current.estado === 'PENDIENTE')
      throw new ConflictException('Este emprendimiento está pendiente: apruébalo o recházalo primero');
    if (estado === 'ACTIVO' && (await this.lastDecision(id)) === 'RECHAZADO')
      throw new ConflictException(
        'Este emprendimiento fue rechazado: debe aprobarse de nuevo desde la revisión',
      );
    return this.patch(id, { estadoId: this.estados.id(estado) });
  }

  /** HU-10: only the flag changes — owner and products untouched (CA3). */
  async setDestacado(id: number, { destacado }: DestacadoDto) {
    return this.patch(id, { destacado });
  }

  /**
   * HU-43 CA2: approve (→ ACTIVO) or reject (→ INACTIVO) with a stored, attributable decision.
   * Allowed for pending businesses, and to re-approve a previously rejected one.
   */
  async decidir(admin: AuthUser, id: number, { decision, motivo }: DecisionDto) {
    if (decision === 'RECHAZADO' && (!motivo || motivo.length < 5))
      throw new BadRequestException('Indica el motivo del rechazo (mínimo 5 caracteres)');

    await this.db.transaction(async (tx) => {
      const [e] = await tx
        .select({
          estadoId: emprendimiento.estadoId,
          nombre: emprendimiento.nombre,
          ownerId: emprendimiento.usuarioId,
        })
        .from(emprendimiento)
        .where(eq(emprendimiento.id, id))
        .for('update');
      if (!e) throw new NotFoundException('Emprendimiento no encontrado');

      const estado = this.estados.nombre(e.estadoId);
      const [last] = await tx
        .select({ decision: aprobacionEmprendimiento.decision })
        .from(aprobacionEmprendimiento)
        .where(eq(aprobacionEmprendimiento.emprendimientoId, id))
        .orderBy(desc(aprobacionEmprendimiento.id))
        .limit(1);
      const reviewable = estado === 'PENDIENTE' || (estado === 'INACTIVO' && last?.decision === 'RECHAZADO');
      if (!reviewable) throw new ConflictException('Este emprendimiento ya fue revisado');
      if (decision === 'RECHAZADO' && estado !== 'PENDIENTE')
        throw new ConflictException('Este emprendimiento ya fue rechazado');

      await tx
        .update(emprendimiento)
        .set({ estadoId: this.estados.id(decision === 'APROBADO' ? 'ACTIVO' : 'INACTIVO') })
        .where(eq(emprendimiento.id, id));
      await tx.insert(aprobacionEmprendimiento).values({
        emprendimientoId: id,
        decision,
        motivo: motivo ?? null,
        adminId: admin.id,
      });
      await notificar(tx, {
        usuarioId: e.ownerId,
        tipo: 'APROBACION',
        contenido:
          decision === 'APROBADO'
            ? `${e.nombre} fue aprobado por el CIEI y ya es visible en el marketplace`
            : `${e.nombre} no fue aprobado por el CIEI. Motivo: ${motivo}`,
        referenciaId: id,
      });
    });
    return this.one(id);
  }

  /** HU-43 CA2: full decision history of a business (traceability). */
  async historial(id: number) {
    const [e] = await this.db
      .select({ id: emprendimiento.id })
      .from(emprendimiento)
      .where(eq(emprendimiento.id, id));
    if (!e) throw new NotFoundException('Emprendimiento no encontrado');
    return this.db
      .select({
        id: aprobacionEmprendimiento.id,
        decision: aprobacionEmprendimiento.decision,
        motivo: aprobacionEmprendimiento.motivo,
        fecha: aprobacionEmprendimiento.fecha,
        admin: usuario.nombreCompleto,
      })
      .from(aprobacionEmprendimiento)
      .leftJoin(usuario, eq(aprobacionEmprendimiento.adminId, usuario.id))
      .where(eq(aprobacionEmprendimiento.emprendimientoId, id))
      .orderBy(desc(aprobacionEmprendimiento.id));
  }

  private async lastDecision(id: number) {
    const [last] = await this.db
      .select({ decision: aprobacionEmprendimiento.decision })
      .from(aprobacionEmprendimiento)
      .where(eq(aprobacionEmprendimiento.emprendimientoId, id))
      .orderBy(desc(aprobacionEmprendimiento.id))
      .limit(1);
    return last?.decision;
  }

  private async patch(id: number, values: Partial<typeof emprendimiento.$inferInsert>) {
    const updated = await this.db
      .update(emprendimiento)
      .set(values)
      .where(eq(emprendimiento.id, id))
      .returning({ id: emprendimiento.id });
    if (updated.length === 0) throw new NotFoundException('Emprendimiento no encontrado');
    return this.one(id);
  }

  private async one(id: number) {
    const all = await this.list();
    return all.find((e) => e.id === id)!;
  }
}
