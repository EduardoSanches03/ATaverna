import { type Credentials, type UserResponse, userResponseSchema } from '@ataverna/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Algo deu errado. Tente de novo.';
    throw new ApiError(response.status, message);
  }
  return response;
}

// O Usuário da sessão atual, ou null quando não há sessão.
export async function currentUser(): Promise<UserResponse | null> {
  try {
    return userResponseSchema.parse(await (await call('/auth/me')).json());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function register(credentials: Credentials): Promise<UserResponse> {
  const response = await call('/auth/register', { method: 'POST', body: JSON.stringify(credentials) });
  return userResponseSchema.parse(await response.json());
}

export async function login(credentials: Credentials): Promise<UserResponse> {
  const response = await call('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  return userResponseSchema.parse(await response.json());
}

export async function logout(): Promise<void> {
  await call('/auth/logout', { method: 'POST' });
}
