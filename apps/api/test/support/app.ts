import type { INestApplication } from '@nestjs/common';
import { inject } from 'vitest';
import { createApp } from '../../src/app.js';

export async function startTestApp(): Promise<INestApplication> {
  const app = await createApp({ databaseUrl: inject('databaseUrl'), logger: false });
  await app.init();
  return app;
}
