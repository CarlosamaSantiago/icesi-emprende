import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser, Role, Roles } from '../../common/auth.decorators.js';
import { ImageUpload } from '../files/image-upload.decorator.js';
import { EmprendimientoDto, EstadoProductoDto, ProductoDto } from './negocio.dto.js';
import { NegocioService } from './negocio.service.js';

@ApiTags('mi-negocio')
@ApiBearerAuth()
@Roles(Role.EMPRENDEDOR, Role.ADMIN)
@Controller('mi-negocio')
export class NegocioController {
  constructor(private readonly negocio: NegocioService) {}

  @Get('emprendimientos')
  list(@CurrentUser() u: AuthUser) {
    return this.negocio.list(u.id);
  }

  @Post('emprendimientos')
  create(@CurrentUser() u: AuthUser, @Body() dto: EmprendimientoDto) {
    return this.negocio.create(u.id, dto);
  }

  @Get('emprendimientos/:id')
  get(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.negocio.get(u.id, id);
  }

  @Patch('emprendimientos/:id')
  update(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: EmprendimientoDto) {
    return this.negocio.update(u.id, id, dto);
  }

  @Put('emprendimientos/:id/logo')
  @ImageUpload()
  logo(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.negocio.updateLogo(u.id, id, file);
  }

  @Get('emprendimientos/:id/productos')
  products(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.negocio.products(u.id, id);
  }

  @Post('emprendimientos/:id/productos')
  createProduct(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ProductoDto) {
    return this.negocio.createProduct(u.id, id, dto);
  }

  @Get('productos/:id')
  getProduct(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.negocio.getProduct(u.id, id);
  }

  @Patch('productos/:id')
  updateProduct(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ProductoDto) {
    return this.negocio.updateProduct(u.id, id, dto);
  }

  @Patch('productos/:id/estado')
  status(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: EstadoProductoDto) {
    return this.negocio.setProductStatus(u.id, id, dto);
  }

  @Post('productos/:id/imagenes')
  @ImageUpload()
  addImage(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.negocio.addImage(u.id, id, file);
  }

  @Delete('productos/:id/imagenes/:imageId')
  deleteImage(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.negocio.deleteImage(u.id, id, imageId);
  }
}
