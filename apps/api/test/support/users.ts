import { randomUUID } from 'node:crypto';
import type { Response } from 'supertest';

// Todos os testes dividem o mesmo banco: cada Usuário ganha um nome que não colide.
export function uniqueUsername(): string {
  return `u_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
}

// O cookie de sessão que a resposta definiu, com os atributos. O supertest reenvia só o nome=valor.
export function sessionCookie(response: Response): string {
  const cookies = ([] as string[]).concat(response.headers['set-cookie'] ?? []);
  const session = cookies.find((cookie) => cookie.startsWith('session='));
  if (!session) {
    throw new Error(`A resposta não definiu o cookie de sessão (Set-Cookie: ${JSON.stringify(cookies)})`);
  }
  return session;
}
