import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsPositive, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class EmprendimientoDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(2) @MaxLength(120) nombre: string;
  @ApiProperty() @IsInt() @IsPositive() categoriaId: number;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(10) @MaxLength(1000) descripcion: string;
}

export class ProductoDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(2) @MaxLength(120) nombre: string;
  @ApiProperty() @Transform(trim) @IsString() @MinLength(5) @MaxLength(1000) descripcion: string;
  @ApiProperty() @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() @Max(100_000_000) precio: number;
  @ApiProperty() @IsInt() @Min(0) @Max(100_000) stockDisponible: number;
}

export class EstadoProductoDto {
  @ApiProperty({ enum: ['ACTIVO', 'INACTIVO'] }) @IsIn(['ACTIVO', 'INACTIVO']) estado: 'ACTIVO' | 'INACTIVO';
}
