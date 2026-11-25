import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Role, Roles } from '../../common/auth.decorators.js';
import { DelMesDto, IndicadoresQueryDto, RankingQueryDto } from './admin.dto.js';
import { AdminReportesService } from './admin-reportes.service.js';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminReportesController {
  constructor(private readonly reportes: AdminReportesService) {}

  @Get('semestres')
  semestres() {
    return this.reportes.semestres();
  }

  @Get('semestres/:id/emprendimientos')
  deSemestre(@Param('id', ParseIntPipe) id: number) {
    return this.reportes.emprendimientosDeSemestre(id);
  }

  @Get('ranking')
  ranking(@Query() { semestreId }: RankingQueryDto) {
    return this.reportes.ranking(semestreId);
  }

  @Get('indicadores')
  indicadores(@Query() { desde, hasta }: IndicadoresQueryDto) {
    return this.reportes.indicadores(desde, hasta);
  }

  @Get('emprendimiento-del-mes')
  historial() {
    return this.reportes.historialDelMes();
  }

  @Post('emprendimiento-del-mes')
  designar(@CurrentUser() admin: AuthUser, @Body() dto: DelMesDto) {
    return this.reportes.designar(admin, dto);
  }
}
