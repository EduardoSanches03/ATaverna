import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);

// Parâmetros mínimos recomendados pela OWASP para argon2id.
const params = { memory: 19_456, passes: 2, parallelism: 1, tagLength: 32 };

// Formato PHC: $argon2id$v=19$m=…,t=…,p=…$<salt>$<hash>, com os parâmetros junto do hash
// para que uma mudança futura nos parâmetros não invalide as senhas já guardadas.
export async function hashPassword(password: string): Promise<string> {
  const nonce = randomBytes(16);
  const tag = await argon2Async('argon2id', { message: password, nonce, ...params });
  return `$argon2id$v=19$m=${params.memory},t=${params.passes},p=${params.parallelism}$${nonce.toString('base64url')}$${tag.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, algorithm, , paramList, salt, hash] = stored.split('$');
  if (algorithm !== 'argon2id' || !paramList || !salt || !hash) {
    return false;
  }
  const [memory, passes, parallelism] = paramList.split(',').map((pair) => Number(pair.split('=')[1]));
  const expected = Buffer.from(hash, 'base64url');
  const tag = await argon2Async('argon2id', {
    message: password,
    nonce: Buffer.from(salt, 'base64url'),
    memory: memory!,
    passes: passes!,
    parallelism: parallelism!,
    tagLength: expected.length,
  });
  return timingSafeEqual(tag, expected);
}
