import { Module, type DynamicModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';

@Module({})
export class AppModule {
  static forRoot(options: { databaseUrl: string }): DynamicModule {
    return {
      module: AppModule,
      imports: [DatabaseModule.forRoot(options.databaseUrl)],
      controllers: [HealthController],
    };
  }
}
