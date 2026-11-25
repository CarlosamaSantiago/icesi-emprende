import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Matches } from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** HU-32: optional date range (inclusive, "YYYY-MM-DD"). Real-date and ordering checks live in the service. */
export class MetricasQueryDto {
  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @Matches(FECHA, { message: 'La fecha inicial debe tener el formato AAAA-MM-DD' })
  desde?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @Matches(FECHA, { message: 'La fecha final debe tener el formato AAAA-MM-DD' })
  hasta?: string;

  @ApiPropertyOptional({ description: 'Limit to one of your businesses' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  emprendimientoId?: number;
}
