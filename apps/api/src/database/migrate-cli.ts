import { runMigrations } from './migrate.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não definida');
}

await runMigrations(databaseUrl);
console.log('Migrações aplicadas');
