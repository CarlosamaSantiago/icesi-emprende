import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '../../common/auth.decorators.js';
import { AdminCategoriasService } from './admin-categorias.service.js';
import { CategoriaDto } from './admin.dto.js';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/categorias')
export class AdminCategoriasController {
  constructor(private readonly categorias: AdminCategoriasService) {}

  @Get()
  list() {
    return this.categorias.list();
  }

  @Post()
  create(@Body() dto: CategoriaDto) {
    return this.categorias.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CategoriaDto) {
    return this.categorias.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categorias.remove(id);
  }
}
