import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { AuthUser, Role } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import { consentimiento, rol, userRole, usuario } from '../../database/schema.js';
import { VERSION_POLITICA_DATOS } from '../legal/legal.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async login({ correo, clave }: LoginDto) {
    const user = await this.db.query.usuario.findFirst({
      where: eq(usuario.correoInstitucional, correo),
      with: { roles: { with: { rol: true } } },
    });
    // Same message for unknown email and wrong password (no user enumeration)
    if (!user || !(await bcrypt.compare(clave, user.clave))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    return this.issue({
      id: user.id,
      email: user.correoInstitucional,
      nombre: user.nombreCompleto,
      roles: user.roles.map((r) => r.rol.nombre as Role),
    });
  }

  async register(dto: RegisterDto) {
    const exists = await this.db.query.usuario.findFirst({
      where: eq(usuario.correoInstitucional, dto.correo),
    });
    if (exists) throw new ConflictException('Ya existe una cuenta con ese correo');

    const roleName = dto.rol ?? Role.COMPRADOR;
    const created = await this.db.transaction(async (tx) => {
      const [u] = await tx
        .insert(usuario)
        .values({
          nombreCompleto: dto.nombreCompleto,
          correoInstitucional: dto.correo,
          programaAcademico: dto.programaAcademico,
          semestreAcademico: dto.semestreAcademico,
          clave: await bcrypt.hash(dto.clave, 10),
        })
        .returning();
      const r = await tx.query.rol.findFirst({ where: eq(rol.nombre, roleName) });
      await tx.insert(userRole).values({ usuarioId: u.id, rolId: r!.id });
      await tx.insert(consentimiento).values({ usuarioId: u.id, version: VERSION_POLITICA_DATOS });
      return u;
    });

    return this.issue({
      id: created.id,
      email: created.correoInstitucional,
      nombre: created.nombreCompleto,
      roles: [roleName as Role],
    });
  }

  async me(userId: number) {
    const u = await this.db.query.usuario.findFirst({
      where: eq(usuario.id, userId),
      columns: { clave: false },
      with: { roles: { with: { rol: true } } },
    });
    if (!u) throw new UnauthorizedException();
    const { roles, ...rest } = u;
    return { ...rest, roles: roles.map((r) => r.rol.nombre) };
  }

  private async issue(user: AuthUser) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      roles: user.roles,
    });
    return { accessToken, user };
  }
}
