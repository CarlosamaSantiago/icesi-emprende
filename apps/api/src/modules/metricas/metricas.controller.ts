import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Role, Roles } from '../../common/auth.decorators.js';
import { MetricasQueryDto } from './metricas.dto.js';
import { MetricasService } from './metricas.service.js';

const stamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

@ApiTags('metricas')
@ApiBearerAuth()
@Roles(Role.EMPRENDEDOR, Role.ADMIN)
@Controller('metricas')
export class MetricasController {
  constructor(private readonly metricas: MetricasService) {}

  @Get()
  obtener(@CurrentUser() u: AuthUser, @Query() q: MetricasQueryDto) {
    return this.metricas.obtener(u, q);
  }

  @Get('pdf')
  async pdf(@CurrentUser() u: AuthUser, @Query() q: MetricasQueryDto) {
    return new StreamableFile(await this.metricas.pdf(u, q), {
      type: 'application/pdf',
      disposition: `attachment; filename="reporte_metricas_${stamp()}.pdf"`,
    });
  }

  @Get('csv')
  async csv(@CurrentUser() u: AuthUser, @Query() q: MetricasQueryDto) {
    return new StreamableFile(Buffer.from(await this.metricas.csv(u, q), 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="metricas_${stamp()}.csv"`,
    });
  }
}
