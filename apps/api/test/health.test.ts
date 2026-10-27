import type { INestApplication } from '@nestjs/common';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { startTestApp } from './support/app.js';

describe('healthcheck', () => {
  describe('com o banco disponível', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await startTestApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it('responde ok', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', database: 'ok' });
    });

    it('continua de pé e se reconecta depois que o banco derruba as conexões', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);

      // Simula um restart do Postgres: encerra todas as conexões ociosas da API.
      const admin = new pg.Client({ connectionString: inject('databaseUrl') });
      await admin.connect();
      await admin.query('select pg_terminate_backend(pid) from pg_stat_activity where pid <> pg_backend_pid() and datname = current_database()');
      await admin.end();
      await new Promise((resolve) => setTimeout(resolve, 200));

      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', database: 'ok' });
    });
  });

  describe('com o banco inacessível', () => {
    let app: INestApplication;

    beforeAll(async () => {
      // Porta 1 nunca tem Postgres: a conexão é recusada na hora.
      app = await startTestApp({ databaseUrl: 'postgres://ataverna:ataverna@127.0.0.1:1/ataverna' });
    });

    afterAll(async () => {
      await app.close();
    });

    it('responde 503 indicando que o banco está indisponível', async () => {
      const response = await request(app.getHttpServer()).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toEqual({ status: 'error', database: 'unavailable' });
    });
  });
});
