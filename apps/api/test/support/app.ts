import type { INestApplication } from '@nestjs/common';
import { inject } from 'vitest';
import { createApp, type AppConfig } from '../../src/app.js';

export const testSessionSecret = 'segredo-de-teste-com-pelo-menos-32-caracteres';

export async function startTestApp(overrides: Partial<AppConfig> = {}): Promise<INestApplication> {
  const app = await createApp({
    databaseUrl: inject('databaseUrl'),
    sessionSecret: testSessionSecret,
    logger: false,
    ...overrides,
  });
  await app.init();
  return app;
}
