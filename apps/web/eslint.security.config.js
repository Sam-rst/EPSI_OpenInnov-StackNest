// Config ESLint sécurité — passe ciblée, distincte du `lint` général.
// Charge UNIQUEMENT eslint-plugin-security (recommended) sur le code source.
// Utilisée par `npm run security:lint`. Ne PAS rattacher au eslint.config.js
// principal (évite de casser le `lint` existant).
//
// NB : le parser typescript-eslint est requis pour que la passe sache lire
// TS/TSX (sinon erreurs de parsing « Unexpected token », pas des findings sécu).
// Les tests/fixtures sont exclus (sources de faux positifs, comme côté back).
import security from 'eslint-plugin-security'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'reports',
    'src/**/*.test.{ts,tsx}',
    'src/**/__tests__/**',
    'src/**/*.fixtures.{ts,tsx}',
    'src/vite-env.d.ts',
  ]),
  {
    files: ['src/**/*.{ts,tsx}'],
    ...security.configs.recommended,
    // react-hooks enregistré SANS aucune règle activée : juste pour que les
    // directives inline `eslint-disable react-hooks/*` du code résolvent leur
    // namespace (sinon ESLint lève une erreur fatale « rule not found »).
    plugins: {
      ...security.configs.recommended.plugins,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
])
