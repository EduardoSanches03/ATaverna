import { Module, type DynamicModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';

@Module({})
export class AppModule {
  static forRoot(options: { databaseUrl: string; sessionSecret: string }): DynamicModule {
    return {
      module: AppModule,
      imports: [DatabaseModule.forRoot(options.databaseUrl), AuthModule.forRoot(options.sessionSecret)],
      controllers: [HealthController],
    };
  }
}
