import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';
import { type Database, InjectDb } from '../../database/database.module.js';
import { categoria, emprendimiento, imagenProducto, producto, semestre } from '../../database/schema.js';
import { StorageService } from '../files/storage.service.js';
import { EstadosService } from '../shared/estados.service.js';
import {
  productoDetalle,
  selectEmprendimientos,
  selectProductos,
  toEmprendimientoResumen,
  toProductoResumen,
} from '../shared/presenters.js';
import { EmprendimientoDto, EstadoProductoDto, ProductoDto } from './negocio.dto.js';

const MAX_IMAGES = 8;

/** Explicit allow-list of writable columns (never spread request DTOs into the DB). */
const productFields = (d: ProductoDto) => ({
  nombre: d.nombre,
  descripcion: d.descripcion,
  precio: d.precio,
  stockDisponible: d.stockDisponible,
});

/**
 * Owner-scoped operations. Every method receives the authenticated user id and filters by it,
 * so a non-owner gets 404 (we don't reveal that the resource exists) — HU-07 CA3, HU-12 CA3.
 */
@Injectable()
export class NegocioService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly estados: EstadosService,
    private readonly storage: StorageService,
  ) {}

  // ---------------------------------------------------------------- emprendimientos
  async list(userId: number) {
    return (await selectEmprendimientos(this.db, eq(emprendimiento.usuarioId, userId))).map(
      toEmprendimientoResumen,
    );
  }

  async get(userId: number, id: number) {
    const [row] = await selectEmprendimientos(
      this.db,
      and(eq(emprendimiento.id, id), eq(emprendimiento.usuarioId, userId)),
    );
    if (!row) throw new NotFoundException('Emprendimiento no encontrado');
    return toEmprendimientoResumen(row);
  }

  /** HU-05: starts PENDIENTE (needs CIEI activation) in the current active semester. */
  async create(userId: number, dto: EmprendimientoDto) {
    await this.assertCategoria(dto.categoriaId);
    const [sem] = await this.db
      .select({ id: semestre.id })
      .from(semestre)
      .where(eq(semestre.estadoId, this.estados.id('ACTIVO')))
      .orderBy(desc(semestre.fechaInicio))
      .limit(1);
    if (!sem) throw new ConflictException('No hay un semestre activo configurado. Contacta al CIEI.');

    const [created] = await this.db
      .insert(emprendimiento)
      .values({
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        categoriaId: dto.categoriaId,
        usuarioId: userId,
        semestreId: sem.id,
        estadoId: this.estados.id('PENDIENTE'),
      })
      .returning({ id: emprendimiento.id });
    return this.get(userId, created.id);
  }

  /** HU-07: name, description, category. State/featured are admin-only and not accepted here. */
  async update(userId: number, id: number, dto: EmprendimientoDto) {
    await this.get(userId, id);
    await this.assertCategoria(dto.categoriaId);
    await this.db
      .update(emprendimiento)
      .set({ nombre: dto.nombre, descripcion: dto.descripcion, categoriaId: dto.categoriaId })
      .where(eq(emprendimiento.id, id));
    return this.get(userId, id);
  }

  async updateLogo(userId: number, id: number, file: Express.Multer.File | undefined) {
    const before = await this.get(userId, id);
    const url = await this.storage.saveImage(file, userId);
    await this.db.update(emprendimiento).set({ logoUrl: url }).where(eq(emprendimiento.id, id));
    await this.storage.deleteByUrl(before.logoUrl);
    return this.get(userId, id);
  }

  // ---------------------------------------------------------------- productos
  async products(userId: number, emprendimientoId: number) {
    await this.get(userId, emprendimientoId);
    return (await selectProductos(this.db, eq(producto.emprendimientoId, emprendimientoId))).map(
      toProductoResumen,
    );
  }

  /** HU-11: new products start ACTIVO; they are only public while the business is ACTIVO. */
  async createProduct(userId: number, emprendimientoId: number, dto: ProductoDto) {
    await this.get(userId, emprendimientoId);
    const [created] = await this.db
      .insert(producto)
      .values({ ...productFields(dto), emprendimientoId, estadoId: this.estados.id('ACTIVO') })
      .returning({ id: producto.id });
    return toProductoResumen(await this.productRow(userId, created.id));
  }

  async getProduct(userId: number, id: number) {
    return productoDetalle(this.db, await this.productRow(userId, id));
  }

  /** HU-12 */
  async updateProduct(userId: number, id: number, dto: ProductoDto) {
    await this.productRow(userId, id);
    await this.db.update(producto).set(productFields(dto)).where(eq(producto.id, id));
    return this.getProduct(userId, id);
  }

  /** HU-13: soft toggle; the record (and its order history) is preserved. */
  async setProductStatus(userId: number, id: number, { estado }: EstadoProductoDto) {
    await this.productRow(userId, id);
    await this.db
      .update(producto)
      .set({ estadoId: this.estados.id(estado) })
      .where(eq(producto.id, id));
    return toProductoResumen(await this.productRow(userId, id));
  }

  /** HU-14 */
  async addImage(userId: number, id: number, file: Express.Multer.File | undefined) {
    await this.productRow(userId, id);
    const [{ n }] = await this.db
      .select({ n: count() })
      .from(imagenProducto)
      .where(eq(imagenProducto.productoId, id));
    if (n >= MAX_IMAGES) throw new BadRequestException(`Máximo ${MAX_IMAGES} imágenes por producto`);
    const url = await this.storage.saveImage(file, userId);
    await this.db.insert(imagenProducto).values({ productoId: id, urlImagen: url });
    return this.getProduct(userId, id);
  }

  async deleteImage(userId: number, id: number, imageId: number) {
    await this.productRow(userId, id);
    const [deleted] = await this.db
      .delete(imagenProducto)
      .where(and(eq(imagenProducto.id, imageId), eq(imagenProducto.productoId, id)))
      .returning({ url: imagenProducto.urlImagen });
    if (!deleted) throw new NotFoundException('Imagen no encontrada');
    await this.storage.deleteByUrl(deleted.url);
    return this.getProduct(userId, id);
  }

  // ---------------------------------------------------------------- helpers
  private async productRow(userId: number, id: number) {
    const [row] = await selectProductos(
      this.db,
      and(eq(producto.id, id), eq(emprendimiento.usuarioId, userId)),
    );
    if (!row) throw new NotFoundException('Producto no encontrado');
    return row;
  }

  private async assertCategoria(id: number) {
    const [c] = await this.db.select({ id: categoria.id }).from(categoria).where(eq(categoria.id, id));
    if (!c) throw new BadRequestException('Categoría inválida');
  }
}
