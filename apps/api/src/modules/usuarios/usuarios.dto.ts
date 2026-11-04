import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdatePerfilDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) nombreCompleto: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) programaAcademico: string;
  @ApiProperty() @IsInt() @Min(1) @Max(12) semestreAcademico: number;
}
