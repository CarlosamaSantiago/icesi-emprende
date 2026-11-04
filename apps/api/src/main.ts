import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.useBodyParser('json', { limit: '100kb' });
  app.setGlobalPrefix('api', { exclude: ['health'] });
  // No CORS: browsers never call this API directly (BFF, ADR-04). Only the Next.js server does.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const doc = new DocumentBuilder()
    .setTitle('Emprende ICESI API')
    .setDescription('API REST de la plataforma de emprendimientos universitarios')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, doc));

  const port = config.get<number>('PORT')!;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API on :${port}  ·  docs at /docs`, 'Bootstrap');
}
await bootstrap();
