import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { type AuthUser, Role } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';
import {
  calificacionProducto,
  mensaje,
  notificacion,
  reporte,
  rol,
  userRole,
  usuario,
} from '../../database/schema.js';

const likeTerm = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

@Injectable()
export class AdminUsuariosService {
  constructor(@InjectDb() private readonly db: Database) {}

  /** HU-26 CA1: name, email, program and roles of every account (optionally filtered). */
  async list(q?: string) {
    const where: (SQL | undefined)[] = [];
    if (q) {
      const t = likeTerm(q);
      where.push(
        or(
          ilike(usuario.nombreCompleto, t),
          ilike(usuario.correoInstitucional, t),
          ilike(usuario.programaAcademico, t),
        ),
      );
    }
    const [users, roles] = await Promise.all([
      this.db
        .select({
          id: usuario.id,
          nombreCompleto: usuario.nombreCompleto,
          correo: usuario.correoInstitucional,
          programaAcademico: usuario.programaAcademico,
          semestreAcademico: usuario.semestreAcademico,
          fotoPerfil: usuario.fotoPerfil,
          totalEmprendimientos:
            // Raw, table-qualified: in a single-table select Drizzle renders columns unqualified, which would make the correlation always true.
            sql<number>`(select count(*) from emprendimiento e where e.id_usuario = "usuario"."id_usuario")`.mapWith(
              Number,
            ),
          totalPedidos:
            sql<number>`(select count(*) from pedido p where p.id_usuario = "usuario"."id_usuario")`.mapWith(
              Number,
            ),
        })
        .from(usuario)
        .where(and(...where))
        .orderBy(asc(usuario.nombreCompleto)),
      this.db
        .select({ usuarioId: userRole.usuarioId, nombre: rol.nombre })
        .from(userRole)
        .innerJoin(rol, eq(userRole.rolId, rol.id))
        .orderBy(asc(rol.id)),
    ]);
    const byUser = Map.groupBy(roles, (r) => r.usuarioId);
    return users.map((u) => ({ ...u, roles: (byUser.get(u.id) ?? []).map((r) => r.nombre) }));
  }

  /** HU-27 CA1: assignable roles. */
  roles() {
    return this.db.select({ id: rol.id, nombre: rol.nombre }).from(rol).orderBy(asc(rol.id));
  }

  private async load(id: number) {
    const [u] = (await this.list()).filter((x) => x.id === id);
    if (!u) throw new NotFoundException('Usuario no encontrado');
    return u;
  }

  private async rolId(nombre: string) {
    const [r] = await this.db.select({ id: rol.id }).from(rol).where(eq(rol.nombre, nombre));
    if (!r) throw new NotFoundException('Rol no encontrado');
    return r.id;
  }

  /** HU-27 CA2. Idempotent: assigning a role the user already has changes nothing. */
  async asignarRol(userId: number, nombre: string) {
    await this.load(userId);
    await this.db
      .insert(userRole)
      .values({ usuarioId: userId, rolId: await this.rolId(nombre) })
      .onConflictDoNothing();
    return this.load(userId);
  }

  /**
   * HU-27 CA2/CA3. Guard rails: an admin cannot strip their own admin role, the platform always keeps
   * one admin, and every account keeps at least one role. The API re-reads roles from the database on
   * every request (JwtAuthGuard), so a revoked role stops working immediately, not at token expiry.
   */
  async quitarRol(actor: AuthUser, userId: number, nombre: string) {
    const target = await this.load(userId);
    if (!target.roles.includes(nombre)) return target;
    if (nombre === Role.ADMIN && actor.id === userId)
      throw new ConflictException('No puedes quitarte a ti mismo el rol de administrador');
    if (nombre === Role.ADMIN && (await this.countAdmins()) <= 1)
      throw new ConflictException('Debe existir al menos un administrador');
    if (target.roles.length <= 1) throw new ConflictException('El usuario debe conservar al menos un rol');

    await this.db
      .delete(userRole)
      .where(and(eq(userRole.usuarioId, userId), eq(userRole.rolId, await this.rolId(nombre))));
    return this.load(userId);
  }

  private async countAdmins() {
    const [r] = await this.db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(userRole)
      .innerJoin(rol, eq(userRole.rolId, rol.id))
      .where(eq(rol.nombre, Role.ADMIN));
    return r.n;
  }

  /**
   * HU-26 CA2 — data policy (assumption, to be confirmed with the CIEI):
   *  • you cannot delete yourself or the last administrator;
   *  • accounts with businesses or orders are NOT deletable: their commercial history must be preserved;
   *  • otherwise the account and its personal by-products (notifications, product reviews, messages,
   *    reports) are removed together, in one transaction. Consent records and roles cascade.
   */
  async eliminar(actor: AuthUser, userId: number) {
    const target = await this.load(userId);
    if (actor.id === userId) throw new ConflictException('No puedes eliminar tu propia cuenta');
    if (target.roles.includes(Role.ADMIN) && (await this.countAdmins()) <= 1)
      throw new ConflictException('No puedes eliminar al último administrador');
    if (target.totalEmprendimientos > 0)
      throw new ConflictException(
        `${target.nombreCompleto} tiene ${target.totalEmprendimientos} emprendimiento(s) registrado(s). Por la política de datos no se elimina una cuenta con historial comercial.`,
      );
    if (target.totalPedidos > 0)
      throw new ConflictException(
        `${target.nombreCompleto} tiene ${target.totalPedidos} pedido(s). Por la política de datos no se elimina una cuenta con historial comercial.`,
      );

    await this.db.transaction(async (tx) => {
      await tx.delete(notificacion).where(eq(notificacion.usuarioId, userId));
      await tx.delete(calificacionProducto).where(eq(calificacionProducto.usuarioId, userId));
      await tx.delete(mensaje).where(or(eq(mensaje.remitenteId, userId), eq(mensaje.receptorId, userId)));
      await tx.delete(reporte).where(eq(reporte.usuarioId, userId));
      await tx.delete(usuario).where(eq(usuario.id, userId));
    });
  }
}
