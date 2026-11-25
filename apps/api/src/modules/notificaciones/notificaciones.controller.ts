import { Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../../common/auth.decorators.js';
import { NotificacionesService } from './notificaciones.service.js';

@ApiTags('notificaciones')
@ApiBearerAuth()
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) {
    return this.notificaciones.list(u);
  }

  @Post('leer-todas')
  @HttpCode(200)
  leerTodas(@CurrentUser() u: AuthUser) {
    return this.notificaciones.marcarTodasLeidas(u);
  }

  @Patch(':id/leida')
  leida(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.notificaciones.marcarLeida(u, id);
  }
}
