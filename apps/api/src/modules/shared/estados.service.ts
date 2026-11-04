import { Injectable, OnModuleInit } from '@nestjs/common';
import { type Database, InjectDb } from '../../database/database.module.js';
import { estado } from '../../database/schema.js';

export type EstadoNombre =
  'ACTIVO' | 'INACTIVO' | 'PENDIENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'ENTREGADO' | 'CANCELADO';

/** In-memory cache of the `estado` catalog (seeded, immutable at runtime). */
@Injectable()
export class EstadosService implements OnModuleInit {
  private byName = new Map<string, number>();
  private byId = new Map<number, EstadoNombre>();

  constructor(@InjectDb() private readonly db: Database) {}

  async onModuleInit() {
    const rows = await this.db.select().from(estado);
    for (const r of rows) {
      this.byName.set(r.nombre, r.id);
      this.byId.set(r.id, r.nombre as EstadoNombre);
    }
  }

  id(nombre: EstadoNombre): number {
    const id = this.byName.get(nombre);
    if (id === undefined) throw new Error(`Estado ${nombre} no existe en la base de datos`);
    return id;
  }

  nombre(id: number): EstadoNombre {
    return this.byId.get(id) ?? ('DESCONOCIDO' as EstadoNombre);
  }
}
