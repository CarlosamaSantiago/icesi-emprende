import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const trimOrNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

/** HU-37 CA2 / HU-39 CA1 / HU-40 CA2: 1–5 stars, optional comment. Same rule for businesses and products. */
export class CalificacionDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt({ message: 'La puntuación debe ser un número entero de 1 a 5' })
  @Min(1, { message: 'La puntuación mínima es 1 estrella' })
  @Max(5, { message: 'La puntuación máxima es 5 estrellas' })
  puntuacion: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(500, { message: 'El comentario admite máximo 500 caracteres' })
  comentario?: string | null;
}
