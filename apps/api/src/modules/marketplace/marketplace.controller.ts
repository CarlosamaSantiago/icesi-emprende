import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Public } from '../../common/auth.decorators.js';
import { CatalogQueryDto } from './marketplace.dto.js';
import { MarketplaceService } from './marketplace.service.js';

/** Public endpoints. A valid token (if present) is still parsed so owners/admins can preview. */
@ApiTags('marketplace')
@Public()
@Controller()
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Get('categorias')
  categorias() {
    return this.marketplace.categorias();
  }

  @Get('marketplace/productos')
  catalog(@Query() query: CatalogQueryDto) {
    return this.marketplace.catalog(query);
  }

  @Get('marketplace/destacados')
  destacados() {
    return this.marketplace.destacados();
  }

  @Get('emprendimientos/:id')
  emprendimiento(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return this.marketplace.emprendimiento(id, user);
  }

  @Get('productos/:id')
  producto(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return this.marketplace.producto(id, user);
  }
}
