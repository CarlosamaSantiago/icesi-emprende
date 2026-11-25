import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimOrNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export class VisibilidadDto {
  @ApiProperty({ enum: ['ACTIVO', 'INACTIVO'] }) @IsIn(['ACTIVO', 'INACTIVO']) estado: 'ACTIVO' | 'INACTIVO';
}

export class DestacadoDto {
  @ApiProperty() @IsBoolean() destacado: boolean;
}

/** HU-43: approve or reject a business awaiting CIEI review. */
export class DecisionDto {
  @ApiProperty({ enum: ['APROBADO', 'RECHAZADO'] })
  @IsIn(['APROBADO', 'RECHAZADO'], { message: 'La decisión debe ser APROBADO o RECHAZADO' })
  decision: 'APROBADO' | 'RECHAZADO';

  @ApiPropertyOptional({ description: 'Required when rejecting' })
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(500)
  motivo?: string | null;
}

// ------------------------------------------------------------------ HU-26 / HU-27
export class UsuariosQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email or program' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class RolDto {
  @ApiProperty({ enum: ['ADMIN', 'EMPRENDEDOR', 'COMPRADOR'] })
  @IsIn(['ADMIN', 'EMPRENDEDOR', 'COMPRADOR'], { message: 'Rol inválido' })
  rol: 'ADMIN' | 'EMPRENDEDOR' | 'COMPRADOR';
}

// ------------------------------------------------------------------ HU-28
export class CategoriaDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(255)
  descripcion?: string | null;
}

// ------------------------------------------------------------------ HU-35 / HU-36 / HU-46
export class RankingQueryDto {
  @ApiPropertyOptional({ description: 'Semester id; defaults to the most recent one' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  semestreId?: number;
}

export class IndicadoresQueryDto {
  @ApiPropertyOptional({ example: '2026-06' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'El mes inicial debe tener el formato AAAA-MM' })
  desde?: string;

  @ApiPropertyOptional({ example: '2026-11' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'El mes final debe tener el formato AAAA-MM' })
  hasta?: string;
}

export class DelMesDto {
  @ApiProperty() @Type(() => Number) @IsInt() @IsPositive() emprendimientoId: number;

  @ApiProperty({ example: '2026-12' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'El mes debe tener el formato AAAA-MM' })
  periodo: string;
}
