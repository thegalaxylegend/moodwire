import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Downgrade from error→warn: valid React patterns trigger these
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      // Keep exhaustive-deps as warn (not error) for intentional omissions
      'react-hooks/exhaustive-deps': 'warn',
      // Gradual migration: any types are too pervasive to error on
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow unused variables prefixed with _ (including catch bindings)
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrors: 'none', // completely ignore unused catch clause variables
      }],
      // Allow intentional empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Allow control characters in regex (used for sanitization)
      'no-control-regex': 'warn',
      // Allow useless escapes (warn only, common in regex)
      'no-useless-escape': 'warn',
      // fast-refresh: warn instead of error for mixed exports
      'react-refresh/only-export-components': 'warn',
    },
  },
])
