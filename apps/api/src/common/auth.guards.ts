import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { type Database, InjectDb } from '../database/database.module.js';
import { rol, userRole, usuario } from '../database/schema.js';
import { AuthUser, IS_PUBLIC, Role, ROLES } from './auth.decorators.js';

/** Global guard: every route requires a valid Bearer JWT unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @InjectDb() private readonly db: Database,
  ) {}

  /** HU-27: roles are re-read from the database on every request, so changes apply immediately. */
  private async liveUser(id: number) {
    const [u] = await this.db
      .select({ id: usuario.id, email: usuario.correoInstitucional, nombre: usuario.nombreCompleto })
      .from(usuario)
      .where(eq(usuario.id, id));
    if (!u) return null;
    const roles = await this.db
      .select({ nombre: rol.nombre })
      .from(userRole)
      .innerJoin(rol, eq(userRole.rolId, rol.id))
      .where(eq(userRole.usuarioId, id));
    return { ...u, roles: roles.map((r) => r.nombre as Role) };
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

    if (token) {
      try {
        const p = await this.jwt.verifyAsync<{ sub: number; email: string; nombre: string; roles: Role[] }>(
          token,
        );
        const live = await this.liveUser(p.sub);
        if (!live) throw new UnauthorizedException('Cuenta no encontrada');
        req.user = live;
      } catch {
        if (!isPublic) throw new UnauthorizedException('Token inválido o expirado');
      }
    }
    if (!isPublic && !req.user) throw new UnauthorizedException('Autenticación requerida');
    return true;
  }
}

/** Global guard: enforces @Roles(...) when present. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!required?.length) return true;
    const user = ctx.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user?.roles.some((r) => required.includes(r))) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }
    return true;
  }
}
