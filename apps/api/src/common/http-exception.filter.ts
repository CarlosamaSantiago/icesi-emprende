import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

/** Uniform error body: { statusCode, message, error }. Hides internals on 500s. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: unknown }).message;
      // Framework-generated messages (multer, throttler) come in English; normalize the user-facing ones.
      const message =
        status === HttpStatus.PAYLOAD_TOO_LARGE
          ? 'El archivo supera el tamaño máximo permitido (2 MB)'
          : status === HttpStatus.TOO_MANY_REQUESTS
            ? 'Demasiados intentos. Espera un minuto e intenta de nuevo.'
            : raw;
      return res.status(status).json({ statusCode: status, message, error: exception.name });
    }

    // Postgres constraint violations → meaningful HTTP codes
    const pgCode =
      (exception as { code?: string; cause?: { code?: string } })?.cause?.code ??
      (exception as { code?: string })?.code;
    if (pgCode === '23505') {
      return res
        .status(HttpStatus.CONFLICT)
        .json({ statusCode: 409, message: 'El registro ya existe', error: 'Conflict' });
    }
    if (pgCode === '23503') {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ statusCode: 400, message: 'Referencia inválida', error: 'BadRequest' });
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ statusCode: 500, message: 'Error interno del servidor', error: 'InternalServerError' });
  }
}
