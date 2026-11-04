import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/auth.decorators.js';
import { StorageService } from './storage.service.js';

@ApiTags('archivos')
@Controller('archivos')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  /** Public image download. Content-Type comes from the sniffed type stored at upload. */
  @Public()
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe()) id: string, @Res() res: Response) {
    const file = await this.storage.read(id);
    if (!file) throw new NotFoundException('Archivo no encontrado');
    res
      .set({
        'Content-Type': file.mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      })
      .send(file.datos);
  }
}
