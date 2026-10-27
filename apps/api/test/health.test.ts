import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
