import type { INestApplication } from '@nestjs/common';
import { decodeJwt, SignJWT } from 'jose';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { startTestApp, testSessionSecret } from './support/app.js';
import { sessionCookie, uniqueUsername } from './support/users.js';

const password = 'senha-forte-1';

describe('auth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('cadastro', () => {
    it('cria o Usuário e devolve o nome de usuário', async () => {
      const username = uniqueUsername();

      const response = await request(app.getHttpServer()).post('/auth/register').send({ username, password });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ username });
    });

    it('já deixa o Usuário logado', async () => {
      const username = uniqueUsername();
      const register = await request(app.getHttpServer()).post('/auth/register').send({ username, password });

      const me = await request(app.getHttpServer()).get('/auth/me').set('Cookie', sessionCookie(register));

      expect(me.status).toBe(200);
      expect(me.body).toEqual({ username });
    });

    it('recusa um nome de usuário que já existe', async () => {
      const username = uniqueUsername();
      await request(app.getHttpServer()).post('/auth/register').send({ username, password }).expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username, password: 'outra-senha-2' });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({ message: 'Nome de usuário já está em uso' });
    });

    it.each([
      ['sem corpo', undefined],
      ['sem senha', { username: 'u_semsenha' }],
      ['nome curto demais', { username: 'ab', password }],
      ['nome longo demais', { username: 'a'.repeat(31), password }],
      ['nome com maiúscula', { username: 'Ana_Maria', password }],
      ['nome com espaço', { username: 'ana maria', password }],
      ['senha curta demais', { username: 'u_senhacurta', password: '1234567' }],
      ['senha longa demais', { username: 'u_senhalonga', password: 'a'.repeat(129) }],
      ['senha que não é texto', { username: 'u_senhanum', password: 12345678 }],
    ])('recusa dados inválidos: %s', async (_case, body) => {
      const response = await request(app.getHttpServer()).post('/auth/register').send(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Dados inválidos' });
    });
  });

  describe('login', () => {
    it('devolve a sessão num cookie httpOnly que vale nas requisições seguintes', async () => {
      const username = uniqueUsername();
      await request(app.getHttpServer()).post('/auth/register').send({ username, password }).expect(201);

      const login = await request(app.getHttpServer()).post('/auth/login').send({ username, password });

      expect(login.status).toBe(200);
      expect(login.body).toEqual({ username });
      const cookie = sessionCookie(login);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/Secure/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Max-Age=2592000/);

      const me = await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie);

      expect(me.status).toBe(200);
      expect(me.body).toEqual({ username });
    });

    it('recusa a senha errada com o mesmo erro genérico, sem sessão', async () => {
      const username = uniqueUsername();
      await request(app.getHttpServer()).post('/auth/register').send({ username, password }).expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username, password: 'senha-errada-9' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Nome de usuário ou senha inválidos' });
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('recusa um nome de usuário que não existe com o mesmo erro genérico, sem sessão', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: uniqueUsername(), password });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Nome de usuário ou senha inválidos' });
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('recusa um corpo sem nome de usuário ou senha', async () => {
      const response = await request(app.getHttpServer()).post('/auth/login').send({ username: uniqueUsername() });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Dados inválidos' });
    });

    it.each([
      ['de outro algoritmo', '$bcrypt$v=19$m=19456,t=2,p=1$c2FsdA$aGFzaA'],
      ['sem parâmetros', '$argon2id$v=19$$c2FsdA$aGFzaA'],
      ['com parâmetro não numérico', '$argon2id$v=19$m=abc,t=2,p=1$c2FsdA$aGFzaA'],
      ['com parâmetro fora dos limites', '$argon2id$v=19$m=1,t=0,p=0$c2FsdA$aGFzaA'],
      ['truncado', '$argon2id$v=19$m=19456'],
      ['vazio', ''],
    ])('trata um hash guardado %s como credencial inválida', async (_case, passwordHash) => {
      // Não há rota que grave um hash inválido: o estado corrompido (legado, importado) vem direto do banco.
      const username = uniqueUsername();
      const db = new pg.Client({ connectionString: inject('databaseUrl') });
      await db.connect();
      await db.query('insert into users (username, password_hash) values ($1, $2)', [username, passwordHash]);
      await db.end();

      const response = await request(app.getHttpServer()).post('/auth/login').send({ username, password });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Nome de usuário ou senha inválidos' });
    });
  });

  describe('logout', () => {
    it('apaga o cookie de sessão', async () => {
      const register = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: uniqueUsername(), password });

      const logout = await request(app.getHttpServer()).post('/auth/logout').set('Cookie', sessionCookie(register));

      expect(logout.status).toBe(204);
      const cleared = sessionCookie(logout);
      expect(cleared).toMatch(/^session=;/);
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(cleared).toMatch(/HttpOnly/);
      expect(cleared).toMatch(/Secure/);
      expect(cleared).toMatch(/SameSite=Lax/);
    });

    it('funciona mesmo sem sessão, para quem tem um cookie já expirado', async () => {
      const logout = await request(app.getHttpServer()).post('/auth/logout');

      expect(logout.status).toBe(204);
      expect(sessionCookie(logout)).toMatch(/^session=;/);
    });
  });

  describe('rota protegida', () => {
    async function signedSession(secret: string, expiresAt: string | number = '1h'): Promise<string> {
      const username = uniqueUsername();
      const register = await request(app.getHttpServer()).post('/auth/register').send({ username, password });
      const me = await request(app.getHttpServer()).get('/auth/me').set('Cookie', sessionCookie(register));
      expect(me.status).toBe(200);
      // Reaproveita o id real do Usuário do token válido, para que só a assinatura ou a validade mude.
      const { sub } = decodeJwt(sessionCookie(register).split(';')[0]!.slice('session='.length));
      const token = await new SignJWT()
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(sub!)
        .setIssuedAt(0)
        .setExpirationTime(expiresAt)
        .sign(new TextEncoder().encode(secret));
      return `session=${token}`;
    }

    it.each([
      ['sem cookie', async () => undefined],
      ['com cookie que não é um JWT', async () => 'session=nao-e-um-jwt'],
      ['com token assinado por outra chave', async () => signedSession('outra-chave-com-pelo-menos-32-caracteres')],
      ['com token expirado', async () => signedSession(testSessionSecret, 1)],
    ])('responde 401 %s', async (_case, cookie) => {
      const value = await cookie();
      const call = request(app.getHttpServer()).get('/auth/me');

      const response = await (value ? call.set('Cookie', value) : call);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'Não autenticado' });
    });
  });
});

describe('auth com cookie sem Secure (desenvolvimento em HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp({ secureCookie: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('define e apaga o cookie de sessão sem o atributo Secure', async () => {
    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ username: uniqueUsername(), password });
    const logout = await request(app.getHttpServer()).post('/auth/logout').set('Cookie', sessionCookie(register));

    expect(sessionCookie(register)).not.toMatch(/Secure/);
    expect(sessionCookie(register)).toMatch(/HttpOnly/);
    expect(sessionCookie(logout)).toMatch(/^session=;/);
    expect(sessionCookie(logout)).not.toMatch(/Secure/);
  });
});
