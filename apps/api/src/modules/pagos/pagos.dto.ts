import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegistrarPagoDto {
  /** REEMBOLSADO is never set by hand: it happens automatically when a paid order is cancelled. */
  @ApiProperty({ enum: ['CONFIRMADO', 'FALLIDO'] })
  @IsIn(['CONFIRMADO', 'FALLIDO'], { message: 'El estado del pago debe ser CONFIRMADO o FALLIDO' })
  estado: 'CONFIRMADO' | 'FALLIDO';

  @ApiPropertyOptional({ maxLength: 100, description: 'Referencia de la transacción (opcional)' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  @IsString()
  @MaxLength(100)
  referencia?: string | null;
}
