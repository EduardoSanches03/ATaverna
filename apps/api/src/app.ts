import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

export interface AppConfig {
  databaseUrl: string;
  // Chave que assina o JWT da sessão; trocá-la encerra todas as sessões.
  sessionSecret: string;
  // Só o desenvolvimento em HTTP desliga: o Safari não guarda cookie Secure vindo de http://localhost.
  secureCookie?: boolean;
  logger?: boolean;
}

export async function createApp(config: AppConfig): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot({ ...config, secureCookie: config.secureCookie ?? true }), { logger: config.logger === false ? false : undefined });
  app.use(cookieParser());
  app.enableShutdownHooks();
  return app;
}
