import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard } from './common/auth.guards.js';
import { validateEnv } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { CalificacionesModule } from './modules/calificaciones/calificaciones.module.js';
import { LegalModule } from './modules/legal/legal.module.js';
import { MetricasModule } from './modules/metricas/metricas.module.js';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module.js';
import { PagosModule } from './modules/pagos/pagos.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthController } from './modules/health/health.controller.js';
import { MarketplaceModule } from './modules/marketplace/marketplace.module.js';
import { NegocioModule } from './modules/negocio/negocio.module.js';
import { PedidosModule } from './modules/pedidos/pedidos.module.js';
import { SharedModule } from './modules/shared/shared.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN'), algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    DatabaseModule,
    SharedModule,
    AuthModule,
    UsuariosModule,
    MarketplaceModule,
    NegocioModule,
    PedidosModule,
    AdminModule,
    MetricasModule,
    CalificacionesModule,
    NotificacionesModule,
    PagosModule,
    LegalModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: authenticate first, then check roles.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
