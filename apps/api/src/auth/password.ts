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

const phc = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([\w-]+)\$([\w-]+)$/;

// Um hash guardado fora do formato (legado, importado, corrompido) conta como senha errada.
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const match = phc.exec(stored);
  if (!match) {
    return false;
  }
  const [, memory, passes, parallelism, salt, hash] = match;
  const expected = Buffer.from(hash!, 'base64url');
  try {
    const tag = await argon2Async('argon2id', {
      message: password,
      nonce: Buffer.from(salt!, 'base64url'),
      memory: Number(memory),
      passes: Number(passes),
      parallelism: Number(parallelism),
      tagLength: expected.length,
    });
    return timingSafeEqual(tag, expected);
  } catch {
    // O argon2 recusa parâmetros fora dos limites (memória, passes, tamanho do salt ou do hash).
    return false;
  }
}
