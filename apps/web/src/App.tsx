import type { UserResponse } from '@ataverna/shared';
import { useEffect, useState } from 'react';
import { currentUser, logout } from './api.js';
import { AuthForm } from './AuthForm.js';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; user: UserResponse | null };

export function App() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    currentUser()
      .then((user) => setState({ status: 'ready', user }))
      .catch(() => setState({ status: 'error' }));
  }, []);

  async function signOut() {
    await logout();
    setState({ status: 'ready', user: null });
  }

  return (
    <main>
      <h1>A Taverna</h1>
      {state.status === 'loading' && <p>Carregando…</p>}
      {state.status === 'error' && <p role="alert">Não foi possível falar com o servidor. Recarregue a página.</p>}
      {state.status === 'ready' &&
        (state.user ? (
          <>
            <p>Olá, {state.user.username}.</p>
            <button type="button" onClick={signOut}>
              Sair
            </button>
          </>
        ) : (
          <AuthForm onAuthenticated={(user) => setState({ status: 'ready', user })} />
        ))}
    </main>
  );
}
