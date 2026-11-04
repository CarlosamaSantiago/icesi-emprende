import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { type Database, InjectDb } from '../../database/database.module.js';
import { usuario } from '../../database/schema.js';
import { StorageService } from '../files/storage.service.js';
import { UpdatePerfilDto } from './usuarios.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly storage: StorageService,
  ) {}

  async perfil(id: number) {
    const u = await this.db.query.usuario.findFirst({
      where: eq(usuario.id, id),
      columns: { clave: false },
      with: { roles: { with: { rol: true } } },
    });
    if (!u) throw new NotFoundException('Usuario no encontrado');
    const { roles, ...rest } = u;
    return { ...rest, roles: roles.map((r) => r.rol.nombre) };
  }

  /** HU-03: email and roles are intentionally not updatable here. */
  async update(id: number, dto: UpdatePerfilDto) {
    await this.db
      .update(usuario)
      .set({
        nombreCompleto: dto.nombreCompleto,
        programaAcademico: dto.programaAcademico,
        semestreAcademico: dto.semestreAcademico,
      })
      .where(eq(usuario.id, id));
    return this.perfil(id);
  }

  /** HU-04: the old photo is only removed after the new one is stored (CA3: keep it on failure). */
  async updateFoto(id: number, file: Express.Multer.File | undefined) {
    const url = await this.storage.saveImage(file, id);
    const [before] = await this.db
      .select({ foto: usuario.fotoPerfil })
      .from(usuario)
      .where(eq(usuario.id, id));
    await this.db.update(usuario).set({ fotoPerfil: url }).where(eq(usuario.id, id));
    await this.storage.deleteByUrl(before?.foto);
    return this.perfil(id);
  }
}
