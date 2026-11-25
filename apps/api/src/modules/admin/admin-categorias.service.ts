import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { type Database, InjectDb } from '../../database/database.module.js';
import { categoria } from '../../database/schema.js';
import type { CategoriaDto } from './admin.dto.js';

@Injectable()
export class AdminCategoriasService {
  constructor(@InjectDb() private readonly db: Database) {}

  /** HU-28 CA1 */
  list() {
    return this.db
      .select({
        id: categoria.id,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        totalEmprendimientos:
          sql<number>`(select count(*) from emprendimiento e where e.id_categoria = "categoria"."id_categoria")`.mapWith(
            Number,
          ),
      })
      .from(categoria)
      .orderBy(asc(categoria.nombre));
  }

  private async one(id: number) {
    const c = (await this.list()).find((x) => x.id === id);
    if (!c) throw new NotFoundException('Categoría no encontrada');
    return c;
  }

  /** HU-28 CA2: names are unique ignoring case and surrounding spaces ("Moda" = "moda "). */
  private async assertUnique(nombre: string, exceptId?: number) {
    const clash = await this.db
      .select({ id: categoria.id })
      .from(categoria)
      .where(
        and(
          sql`lower(${categoria.nombre}) = lower(${nombre})`,
          exceptId ? ne(categoria.id, exceptId) : undefined,
        ),
      );
    if (clash.length > 0) throw new ConflictException('Ya existe una categoría con ese nombre');
  }

  async create(dto: CategoriaDto) {
    await this.assertUnique(dto.nombre);
    const [c] = await this.db
      .insert(categoria)
      .values({ nombre: dto.nombre, descripcion: dto.descripcion ?? null })
      .returning({ id: categoria.id });
    return this.one(c.id);
  }

  async update(id: number, dto: CategoriaDto) {
    await this.one(id);
    await this.assertUnique(dto.nombre, id);
    await this.db
      .update(categoria)
      .set({ nombre: dto.nombre, descripcion: dto.descripcion ?? null })
      .where(eq(categoria.id, id));
    return this.one(id);
  }

  /**
   * HU-28 CA3 — policy: a category with businesses cannot be deleted (they would be left without a category).
   * The admin must first move or remove them. The foreign key enforces the same rule at database level.
   */
  async remove(id: number) {
    const c = await this.one(id);
    if (c.totalEmprendimientos > 0)
      throw new ConflictException(
        `No se puede eliminar "${c.nombre}": tiene ${c.totalEmprendimientos} emprendimiento(s) asociado(s)`,
      );
    await this.db.delete(categoria).where(eq(categoria.id, id));
  }
}
