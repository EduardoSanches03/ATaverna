import type { INestApplication } from '@nestjs/common';
import { inject } from 'vitest';
import { createApp, type AppConfig } from '../../src/app.js';

export async function startTestApp(overrides: Partial<AppConfig> = {}): Promise<INestApplication> {
  const app = await createApp({ databaseUrl: inject('databaseUrl'), logger: false, ...overrides });
  await app.init();
  return app;
}
