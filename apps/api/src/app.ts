import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Module, type DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';

export interface AppConfig {
  databaseUrl: string;
  logger?: boolean;
}

@Module({})
class AppModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [DatabaseModule.forRoot(config.databaseUrl)],
      controllers: [HealthController],
    };
  }
}

export async function createApp(config: AppConfig): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(config), { logger: config.logger === false ? false : undefined });
  app.enableShutdownHooks();
  return app;
}
