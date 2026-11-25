import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Public } from '../../common/auth.decorators.js';
import { CalificacionDto } from './calificaciones.dto.js';
import { CalificacionesService } from './calificaciones.service.js';

@ApiTags('calificaciones')
@ApiBearerAuth()
@Controller()
export class CalificacionesController {
  constructor(private readonly calificaciones: CalificacionesService) {}

  // --- negocio (HU-37, HU-38)
  @Public()
  @Get('emprendimientos/:id/calificaciones')
  deEmprendimiento(@Param('id', ParseIntPipe) id: number, @CurrentUser() u?: AuthUser) {
    return this.calificaciones.resumenEmprendimiento(id, u);
  }

  @Post('pedidos/:id/calificacion')
  calificarPedido(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CalificacionDto,
  ) {
    return this.calificaciones.calificarPedido(u, id, dto);
  }

  // --- productos (HU-39, HU-40)
  @Public()
  @Get('productos/:id/calificaciones')
  deProducto(@Param('id', ParseIntPipe) id: number, @CurrentUser() u?: AuthUser) {
    return this.calificaciones.resumenProducto(id, u);
  }

  @Post('productos/:id/calificaciones')
  calificarProducto(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CalificacionDto,
  ) {
    return this.calificaciones.calificarProducto(u, id, dto);
  }

  @Get('calificaciones-producto/mias')
  mias(@CurrentUser() u: AuthUser) {
    return this.calificaciones.misCalificacionesProducto(u);
  }

  @Patch('calificaciones-producto/:id')
  actualizar(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CalificacionDto,
  ) {
    return this.calificaciones.actualizarProducto(u, id, dto);
  }

  @Delete('calificaciones-producto/:id')
  @HttpCode(204)
  eliminar(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.calificaciones.eliminarProducto(u, id);
  }
}
