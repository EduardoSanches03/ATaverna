import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

export interface AppConfig {
  databaseUrl: string;
  logger?: boolean;
}

export async function createApp(config: AppConfig): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(config), { logger: config.logger === false ? false : undefined });
  app.enableShutdownHooks();
  return app;
}
