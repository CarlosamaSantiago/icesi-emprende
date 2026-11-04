import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { type Database, InjectDb } from '../../database/database.module.js';
import { emprendimiento } from '../../database/schema.js';
import { EstadosService } from '../shared/estados.service.js';
import { selectEmprendimientos, toEmprendimientoResumen } from '../shared/presenters.js';
import { DestacadoDto, VisibilidadDto } from './admin.dto.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly estados: EstadosService,
  ) {}

  /** HU-09 CA1: every business with its current state. */
  async list() {
    return (await selectEmprendimientos(this.db)).map(toEmprendimientoResumen);
  }

  /** HU-09 CA2 */
  async setVisibilidad(id: number, { estado }: VisibilidadDto) {
    return this.patch(id, { estadoId: this.estados.id(estado) });
  }

  /** HU-10: only the flag changes — owner and products untouched (CA3). */
  async setDestacado(id: number, { destacado }: DestacadoDto) {
    return this.patch(id, { destacado });
  }

  private async patch(id: number, values: Partial<typeof emprendimiento.$inferInsert>) {
    const updated = await this.db
      .update(emprendimiento)
      .set(values)
      .where(eq(emprendimiento.id, id))
      .returning({ id: emprendimiento.id });
    if (updated.length === 0) throw new NotFoundException('Emprendimiento no encontrado');
    const [row] = await selectEmprendimientos(this.db, eq(emprendimiento.id, id));
    return toEmprendimientoResumen(row);
  }
}
