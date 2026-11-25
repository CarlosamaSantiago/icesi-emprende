import { Module } from '@nestjs/common';
import { AdminCategoriasController } from './admin-categorias.controller.js';
import { AdminCategoriasService } from './admin-categorias.service.js';
import { AdminReportesController } from './admin-reportes.controller.js';
import { AdminReportesService } from './admin-reportes.service.js';
import { AdminUsuariosController } from './admin-usuarios.controller.js';
import { AdminUsuariosService } from './admin-usuarios.service.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  controllers: [AdminController, AdminUsuariosController, AdminCategoriasController, AdminReportesController],
  providers: [AdminService, AdminUsuariosService, AdminCategoriasService, AdminReportesService],
})
export class AdminModule {}
