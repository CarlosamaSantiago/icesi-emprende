import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { type AuthUser, Role } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import { categoria, emprendimiento, emprendimientoDelMes, estado, producto } from '../../database/schema.js';
import { EstadosService } from '../shared/estados.service.js';
import {
  productoDetalle,
  productoPublico,
  selectEmprendimientos,
  selectProductos,
  toEmprendimientoResumen,
  toProductoResumen,
} from '../shared/presenters.js';
import { periodoActual } from '../shared/periodo.js';
import { CatalogQueryDto } from './marketplace.dto.js';

const PAGE_SIZE = 12;
/** Escape LIKE wildcards so user input is matched literally. */
const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly estados: EstadosService,
  ) {}

  /** HU-46 CA2: the business recognised this month (latest designation wins); only if still ACTIVO. */
  async delMes() {
    const periodo = periodoActual();
    const [d] = await this.db
      .select({ emprendimientoId: emprendimientoDelMes.emprendimientoId })
      .from(emprendimientoDelMes)
      .where(eq(emprendimientoDelMes.periodo, periodo))
      .orderBy(desc(emprendimientoDelMes.id))
      .limit(1);
    if (!d) return { periodo, emprendimiento: null };
    const [e] = await selectEmprendimientos(this.db, eq(emprendimiento.id, d.emprendimientoId));
    return { periodo, emprendimiento: e && e.estado === 'ACTIVO' ? toEmprendimientoResumen(e) : null };
  }

  categorias() {
    return this.db.select().from(categoria).orderBy(asc(categoria.nombre));
  }

  /** HU-15 + HU-16: public catalog = active products of active businesses. */
  async catalog({ q, categoriaId, page }: CatalogQueryDto) {
    const filters: (SQL | undefined)[] = [productoPublico(this.estados.id('ACTIVO'))];
    if (categoriaId) filters.push(eq(emprendimiento.categoriaId, categoriaId));
    if (q) {
      const term = likeTerm(q);
      filters.push(
        or(
          ilike(producto.nombre, term),
          ilike(producto.descripcion, term),
          ilike(emprendimiento.nombre, term),
        ),
      );
    }
    const where = and(...filters);

    const [rows, [{ total }]] = await Promise.all([
      selectProductos(this.db, where)
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      this.db
        .select({ total: count() })
        .from(producto)
        .innerJoin(emprendimiento, eq(producto.emprendimientoId, emprendimiento.id))
        .innerJoin(estado, eq(producto.estadoId, estado.id))
        .where(where),
    ]);
    return { items: rows.map(toProductoResumen), total, page, pageSize: PAGE_SIZE };
  }

  /** HU-10 CA2: featured (and active) businesses. */
  async destacados() {
    const rows = await selectEmprendimientos(
      this.db,
      and(eq(emprendimiento.destacado, true), eq(emprendimiento.estadoId, this.estados.id('ACTIVO'))),
    );
    return rows.map(toEmprendimientoResumen);
  }

  /** HU-08: public page. Non-active businesses are only visible to their owner or an admin. */
  async emprendimiento(id: number, viewer?: AuthUser) {
    const [row] = await selectEmprendimientos(this.db, eq(emprendimiento.id, id));
    if (!row || (row.estado !== 'ACTIVO' && !this.canPreview(row.usuarioId, viewer))) {
      throw new NotFoundException('Emprendimiento no encontrado');
    }
    const productos = await selectProductos(
      this.db,
      and(eq(producto.emprendimientoId, id), eq(producto.estadoId, this.estados.id('ACTIVO'))),
    );
    return { ...toEmprendimientoResumen(row), productos: productos.map(toProductoResumen) };
  }

  /** HU-17 */
  async producto(id: number, viewer?: AuthUser) {
    const [row] = await selectProductos(this.db, eq(producto.id, id));
    const isPublic = row?.estado === 'ACTIVO' && row.emprendimientoEstado === 'ACTIVO';
    if (!row || (!isPublic && !this.canPreview(row.propietarioId, viewer))) {
      throw new NotFoundException('Producto no encontrado');
    }
    return productoDetalle(this.db, row);
  }

  private canPreview(ownerId: number, viewer?: AuthUser) {
    return !!viewer && (viewer.id === ownerId || viewer.roles.includes(Role.ADMIN));
  }
}
