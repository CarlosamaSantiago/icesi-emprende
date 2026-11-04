import { Body, Controller, Get, Patch, Put, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type AuthUser, CurrentUser } from '../../common/auth.decorators.js';
import { ImageUpload } from '../files/image-upload.decorator.js';
import { UpdatePerfilDto } from './usuarios.dto.js';
import { UsuariosService } from './usuarios.service.js';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios/me')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.usuarios.perfil(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdatePerfilDto) {
    return this.usuarios.update(user.id, dto);
  }

  @Put('foto')
  @ImageUpload()
  foto(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.usuarios.updateFoto(user.id, file);
  }
}
