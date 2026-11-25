import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const INSTITUTIONAL_EMAIL = /@(u\.)?icesi\.edu\.co$/i;
const lower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({ example: 'ximena@icesi.edu.co' })
  @Transform(lower)
  @IsEmail()
  correo: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  clave: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Pepito Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombreCompleto: string;

  @ApiProperty({ example: 'pepito@u.icesi.edu.co' })
  @Transform(lower)
  @IsEmail()
  @Matches(INSTITUTIONAL_EMAIL, { message: 'Solo se permiten correos @icesi.edu.co o @u.icesi.edu.co' })
  correo: string;

  @ApiProperty({ example: 'secreto123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt only uses the first 72 bytes
  clave: string;

  @ApiProperty({ example: 'Ingenieria de Sistemas' })
  @IsString()
  @IsNotEmpty()
  programaAcademico: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(12)
  semestreAcademico: number;

  @ApiProperty({ enum: ['COMPRADOR', 'EMPRENDEDOR'], required: false, default: 'COMPRADOR' })
  @IsOptional()
  @IsIn(['COMPRADOR', 'EMPRENDEDOR'])
  rol?: 'COMPRADOR' | 'EMPRENDEDOR';

  /** HU-45 CA1: registration requires explicit acceptance of the personal-data policy. */
  @ApiProperty({ example: true })
  @IsBoolean()
  @Equals(true, { message: 'Debes aceptar la política de tratamiento de datos para registrarte' })
  aceptaTratamientoDatos: boolean;
}
