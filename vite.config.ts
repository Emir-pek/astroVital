import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromRoot = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/**
 * Path aliases — keep in sync with `tsconfig.app.json > compilerOptions.paths`.
 * `@modules/<name>` resolves to the module folder (its index.ts). Deep imports such as
 * `@modules/intake/components/X` resolve at bundle time but are rejected by TypeScript
 * (no matching `paths` entry) and by ESLint (`no-restricted-imports`).
 */
export const aliases = {
  '@core': fromRoot('./src/core'),
  '@app': fromRoot('./src/app'),
  '@modules': fromRoot('./src/modules'),
  '@test': fromRoot('./src/test'),
};

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the production build also works from a static folder / file share
  // on a spacecraft LAN (offline-first; see docs/DECISIONS.md ADR-007).
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: aliases,
  },
});
