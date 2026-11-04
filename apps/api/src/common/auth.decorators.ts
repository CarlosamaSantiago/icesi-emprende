import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'ADMIN',
  EMPRENDEDOR = 'EMPRENDEDOR',
  COMPRADOR = 'COMPRADOR',
}

/** Shape of the authenticated user attached to the request by JwtAuthGuard. */
export interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  roles: Role[];
}

export const IS_PUBLIC = 'isPublic';
export const ROLES = 'roles';

/** Skip JWT authentication for this route. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restrict a route to users having at least one of these roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Injects the authenticated user: `@CurrentUser() user: AuthUser` */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);
