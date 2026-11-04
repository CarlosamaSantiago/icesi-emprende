import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { AuthUser, IS_PUBLIC, Role, ROLES } from './auth.decorators.js';

/** Global guard: every route requires a valid Bearer JWT unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

    if (token) {
      try {
        const p = await this.jwt.verifyAsync<{ sub: number; email: string; nombre: string; roles: Role[] }>(
          token,
        );
        req.user = { id: p.sub, email: p.email, nombre: p.nombre, roles: p.roles };
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
