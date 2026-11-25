import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Role, Roles } from '../../common/auth.decorators.js';
import { DecisionDto, DestacadoDto, VisibilidadDto } from './admin.dto.js';
import { AdminService } from './admin.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/emprendimientos')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  list() {
    return this.admin.list();
  }

  @Patch(':id/estado')
  estado(@Param('id', ParseIntPipe) id: number, @Body() dto: VisibilidadDto) {
    return this.admin.setVisibilidad(id, dto);
  }

  @Patch(':id/destacado')
  destacado(@Param('id', ParseIntPipe) id: number, @Body() dto: DestacadoDto) {
    return this.admin.setDestacado(id, dto);
  }

  /** HU-43 */
  @Post(':id/decision')
  decision(@CurrentUser() admin: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: DecisionDto) {
    return this.admin.decidir(admin, id, dto);
  }

  @Get(':id/aprobaciones')
  aprobaciones(@Param('id', ParseIntPipe) id: number) {
    return this.admin.historial(id);
  }
}
