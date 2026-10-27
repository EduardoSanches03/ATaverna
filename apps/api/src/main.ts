import { createApp } from './app.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não definida');
}

const app = await createApp({ databaseUrl });
await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
