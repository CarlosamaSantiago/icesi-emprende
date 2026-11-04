import { BadRequestException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { type Database, InjectDb } from '../../database/database.module.js';
import { archivo } from '../../database/schema.js';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const URL_PREFIX = '/api/archivos/';

/**
 * Storage abstraction (ADR-07). Callers only deal with opaque URLs like `/api/archivos/<uuid>`.
 * Current implementation: Postgres `archivo` table. Swap for S3/Blob without touching callers.
 */
export abstract class StorageService {
  abstract saveImage(file: Express.Multer.File | undefined, ownerId: number): Promise<string>;
  abstract read(id: string): Promise<{ mime: string; datos: Buffer } | null>;
  abstract deleteByUrl(url: string | null | undefined): Promise<void>;
}

/** Detect the real type from magic bytes — the client-provided mimetype/extension is never trusted. */
export function sniffImage(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  return null;
}

@Injectable()
export class DbStorageService extends StorageService {
  constructor(@InjectDb() private readonly db: Database) {
    super();
  }

  async saveImage(file: Express.Multer.File | undefined, ownerId: number) {
    if (!file?.buffer?.length) throw new BadRequestException('Selecciona una imagen');
    if (file.size > MAX_IMAGE_BYTES) throw new BadRequestException('La imagen supera 2 MB');
    const mime = sniffImage(file.buffer);
    if (!mime) throw new BadRequestException('El archivo no es una imagen válida (JPG, PNG o WebP)');

    const [row] = await this.db
      .insert(archivo)
      .values({ mime, tamano: file.size, datos: file.buffer, usuarioId: ownerId })
      .returning({ id: archivo.id });
    return `${URL_PREFIX}${row.id}`;
  }

  async read(id: string) {
    const [row] = await this.db
      .select({ mime: archivo.mime, datos: archivo.datos })
      .from(archivo)
      .where(eq(archivo.id, id));
    return row ?? null;
  }

  /** Removes a stored file if the URL points to our storage (external seed URLs are ignored). */
  async deleteByUrl(url: string | null | undefined) {
    const id = url?.startsWith(URL_PREFIX) ? url.slice(URL_PREFIX.length) : null;
    if (id && /^[0-9a-f-]{36}$/i.test(id)) await this.db.delete(archivo).where(eq(archivo.id, id));
  }
}
