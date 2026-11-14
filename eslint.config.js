// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * MODULE BOUNDARIES (docs/ARCHITECTURE.md)
 *
 *   core  <-  intake, assessment, visualization, routine, app
 *   assessment  <-  visualization, routine, app
 *   intake, visualization, routine  <-  app
 *
 * - A module may import another module ONLY through its public API: `@modules/<name>`.
 * - Deep imports (`@modules/<name>/components/...`) are forbidden everywhere.
 * - Relative imports that leave the current layer/module (`../../core/...`) are forbidden;
 *   use `@core/*` / `@modules/<name>` so the rule below can see them.
 * - core never imports from modules or app.
 */
const MODULES = ['intake', 'assessment', 'visualization', 'routine'];

/**
 * @param {{ files: string[]; allowModules: string[]; allowApp: boolean; self?: string; layer: string }} opts
 */
function boundary({ files, allowModules, allowApp, self, layer }) {
  const forbidden = MODULES.filter((m) => !allowModules.includes(m) && m !== self);
  /** @type {Array<{ regex: string; message: string }>} */
  const patterns = [
    {
      regex: '^@modules/[^/]+/.+',
      message:
        'Deep import into another module is forbidden. Import from its public API: `@modules/<name>` (index.ts).',
    },
    {
      regex: '^(\\.\\./)+(src|core|app|modules|intake|assessment|visualization|routine)(/|$)',
      message:
        'Relative import crosses a layer/module boundary. Use `@core/*`, `@app/*` or `@modules/<name>` instead.',
    },
    {
      regex: '^/?src/',
      message: 'Do not import via `src/...`. Use the path aliases.',
    },
  ];
  if (forbidden.length > 0) {
    patterns.push({
      regex: `^@modules/(${forbidden.join('|')})$`,
      message: `[${layer}] may not depend on this module (see dependency graph in docs/ARCHITECTURE.md).`,
    });
  }
  if (self) {
    patterns.push({
      regex: `^@modules/${self}$`,
      message: `Inside the ${self} module use relative imports; importing your own public API creates cycles.`,
    });
  }
  if (!allowApp) {
    patterns.push({
      regex: '^@app(/|$)',
      message: `[${layer}] may not import from the app shell. Only the app composes modules.`,
    });
  }
  const testFiles = files
    .filter((f) => f.endsWith('/**'))
    .map((f) => f.replace(/\/\*\*$/, '/**/__tests__/**'));
  return [
    // Production code: additionally may not import test-only helpers.
    {
      files,
      ignores: [...TEST_GLOBS],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              ...patterns,
              { regex: '^@test(/|$)', message: '`@test/*` is test-only infrastructure.' },
            ],
          },
        ],
      },
    },
    // Tests: same boundaries, but `@test/*` helpers allowed.
    { files: testFiles, rules: { 'no-restricted-imports': ['error', { patterns }] } },
  ];
}

const TEST_GLOBS = ['**/__tests__/**', 'src/test/**'];

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  // Tests may export helpers / render multiple components freely.
  {
    files: ['**/__tests__/**', 'src/test/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // ---- Module boundary enforcement -------------------------------------------------
  ...boundary({ files: ['src/core/**'], allowModules: [], allowApp: false, layer: 'core' }),
  ...boundary({
    files: ['src/modules/intake/**'],
    allowModules: [],
    allowApp: false,
    self: 'intake',
    layer: 'intake',
  }),
  ...boundary({
    files: ['src/modules/assessment/**'],
    allowModules: [],
    allowApp: false,
    self: 'assessment',
    layer: 'assessment',
  }),
  ...boundary({
    files: ['src/modules/visualization/**'],
    allowModules: ['assessment'],
    allowApp: false,
    self: 'visualization',
    layer: 'visualization',
  }),
  ...boundary({
    files: ['src/modules/routine/**'],
    allowModules: ['assessment'],
    allowApp: false,
    self: 'routine',
    layer: 'routine',
  }),
  ...boundary({
    files: ['src/app/**', 'src/main.tsx', 'src/test/**'],
    allowModules: MODULES,
    allowApp: true,
    layer: 'app',
  }),

  prettier,
]);
