import { type Credentials, registerSchema, type UserResponse } from '@ataverna/shared';
import { type FormEvent, useState } from 'react';
import { login, register } from './api.js';

type Mode = 'login' | 'register';

export function AuthForm({ onAuthenticated }: { onAuthenticated: (user: UserResponse) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const credentials: Credentials = {
      username: String(form.get('username') ?? '').trim().toLowerCase(),
      password: String(form.get('password') ?? ''),
    };
    if (mode === 'register') {
      const result = registerSchema.safeParse(credentials);
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? 'Dados inválidos');
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      onAuthenticated(await (mode === 'login' ? login : register)(credentials));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  }

  function switchTo(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
      <label>
        Nome de usuário
        <input name="username" autoComplete="username" autoCapitalize="none" required />
      </label>
      <label>
        Senha
        <input
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {mode === 'login' ? 'Entrar' : 'Criar conta'}
      </button>
      {mode === 'login' ? (
        <p>
          Ainda não tem conta?{' '}
          <button type="button" onClick={() => switchTo('register')}>
            Criar conta
          </button>
        </p>
      ) : (
        <p>
          Já tem conta?{' '}
          <button type="button" onClick={() => switchTo('login')}>
            Entrar
          </button>
        </p>
      )}
    </form>
  );
}
