import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { MAX_IMAGE_BYTES } from './storage.service.js';

/** Multipart single image in field `archivo`, kept in memory and capped at 2 MB before reaching the handler. */
export const ImageUpload = () =>
  applyDecorators(
    UseInterceptors(
      FileInterceptor('archivo', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0 } }),
    ),
    ApiConsumes('multipart/form-data'),
    ApiBody({ schema: { type: 'object', properties: { archivo: { type: 'string', format: 'binary' } } } }),
  );
