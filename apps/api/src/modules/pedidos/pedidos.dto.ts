import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsInt,
  IsPositive,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { type EstadoPedido, ESTADOS_PEDIDO } from './pedido-state.js';

export class CheckoutItemDto {
  @ApiProperty() @IsInt() @IsPositive() productoId: number;
  @ApiProperty() @IsInt() @Min(1) @Max(999) cantidad: number;
}

/** Only ids + quantities are accepted. Prices always come from the database. */
export class CheckoutDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items: CheckoutItemDto[];
}

export class UpdateEstadoPedidoDto {
  @ApiProperty({ enum: ESTADOS_PEDIDO }) @IsIn(ESTADOS_PEDIDO) estado: EstadoPedido;
}
