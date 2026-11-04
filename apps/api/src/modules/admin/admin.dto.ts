import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn } from 'class-validator';

export class VisibilidadDto {
  @ApiProperty({ enum: ['ACTIVO', 'INACTIVO'] }) @IsIn(['ACTIVO', 'INACTIVO']) estado: 'ACTIVO' | 'INACTIVO';
}

export class DestacadoDto {
  @ApiProperty() @IsBoolean() destacado: boolean;
}
