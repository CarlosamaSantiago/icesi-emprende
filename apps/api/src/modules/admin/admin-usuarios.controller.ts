import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Role, Roles } from '../../common/auth.decorators.js';
import { AdminUsuariosService } from './admin-usuarios.service.js';
import { RolDto, UsuariosQueryDto } from './admin.dto.js';

/** HU-26, HU-27. ADMIN only: any other role gets 403 from RolesGuard (CA3 / CA6). */
@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminUsuariosController {
  constructor(private readonly usuarios: AdminUsuariosService) {}

  @Get('usuarios')
  list(@Query() { q }: UsuariosQueryDto) {
    return this.usuarios.list(q);
  }

  @Get('roles')
  roles() {
    return this.usuarios.roles();
  }

  @Post('usuarios/:id/roles')
  asignar(@Param('id', ParseIntPipe) id: number, @Body() dto: RolDto) {
    return this.usuarios.asignarRol(id, dto.rol);
  }

  @Delete('usuarios/:id/roles/:rol')
  quitar(@CurrentUser() actor: AuthUser, @Param('id', ParseIntPipe) id: number, @Param('rol') rol: string) {
    return this.usuarios.quitarRol(actor, id, rol);
  }

  @Delete('usuarios/:id')
  @HttpCode(204)
  eliminar(@CurrentUser() actor: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.usuarios.eliminar(actor, id);
  }
}
