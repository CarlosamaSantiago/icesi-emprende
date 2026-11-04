import { Global, Module } from '@nestjs/common';
import { FilesController } from '../files/files.controller.js';
import { DbStorageService, StorageService } from '../files/storage.service.js';
import { EstadosService } from './estados.service.js';

@Global()
@Module({
  controllers: [FilesController],
  providers: [EstadosService, { provide: StorageService, useClass: DbStorageService }],
  exports: [EstadosService, StorageService],
})
export class SharedModule {}
