import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // A API fica na mesma origem da web: o cookie de sessão (SameSite=Lax) vai junto sem CORS.
    proxy: {
      '/api': { target: 'http://localhost:3000', rewrite: (path) => path.replace(/^\/api/, '') },
    },
  },
});
