import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

export interface AppConfig {
  databaseUrl: string;
  // Chave que assina o JWT da sessão; trocá-la encerra todas as sessões.
  sessionSecret: string;
  logger?: boolean;
}

export async function createApp(config: AppConfig): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(config), { logger: config.logger === false ? false : undefined });
  app.use(cookieParser());
  app.enableShutdownHooks();
  return app;
}
