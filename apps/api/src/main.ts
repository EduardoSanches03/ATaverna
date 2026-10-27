import { createApp } from './app.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não definida');
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET não definida ou com menos de 32 caracteres');
}

const app = await createApp({ databaseUrl, sessionSecret, secureCookie: process.env.SESSION_COOKIE_SECURE !== 'false' });
await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
