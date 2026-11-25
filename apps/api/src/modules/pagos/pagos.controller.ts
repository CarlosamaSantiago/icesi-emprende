import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Role, Roles } from '../../common/auth.decorators.js';
import { MetricasQueryDto } from '../metricas/metricas.dto.js';
import { RegistrarPagoDto } from './pagos.dto.js';
import { PagosService } from './pagos.service.js';

@ApiTags('pagos')
@ApiBearerAuth()
@Controller()
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  @Roles(Role.EMPRENDEDOR, Role.ADMIN)
  @Post('pedidos/:id/pago')
  registrar(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarPagoDto,
  ) {
    return this.pagos.registrar(u, id, dto);
  }

  @Roles(Role.ADMIN)
  @Get('admin/pagos')
  listar(@Query() q: MetricasQueryDto) {
    return this.pagos.listarAdmin(q);
  }
}
