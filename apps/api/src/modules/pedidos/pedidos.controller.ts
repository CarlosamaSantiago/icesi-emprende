import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Role, Roles } from '../../common/auth.decorators.js';
import { CheckoutDto, UpdateEstadoPedidoDto } from './pedidos.dto.js';
import { PedidosService } from './pedidos.service.js';

@ApiTags('pedidos')
@ApiBearerAuth()
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post('checkout')
  checkout(@CurrentUser() u: AuthUser, @Body() dto: CheckoutDto) {
    return this.pedidos.checkout(u, dto);
  }

  @Get('mis-compras')
  misCompras(@CurrentUser() u: AuthUser) {
    return this.pedidos.misCompras(u);
  }

  @Roles(Role.EMPRENDEDOR, Role.ADMIN)
  @Get('recibidos')
  recibidos(@CurrentUser() u: AuthUser) {
    return this.pedidos.recibidos(u);
  }

  @Roles(Role.EMPRENDEDOR, Role.ADMIN)
  @Patch(':id/estado')
  updateEstado(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoPedidoDto,
  ) {
    return this.pedidos.updateEstado(u, id, dto);
  }
}
