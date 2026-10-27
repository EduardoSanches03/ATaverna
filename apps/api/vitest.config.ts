import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // O esbuild do Vitest não emite metadados de decorators, que a injeção de dependência do Nest precisa.
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/support/global-setup.ts'],
    hookTimeout: 120_000,
  },
});
