import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

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
    plugins: ['prettier'],
    rules: {
      'prettier/prettier': 'error',
      'max-len': [
        'error',
        80,
        {
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      'dot-notation': ['error', { allowKeywords: true }],
      'no-var': 'error',
      'vars-on-top': 'error',
      quotes: ['error', 'single'],
      'no-console': 'error',
      strict: ['error', 'global'],
      'no-with': 'error',
      'no-else-return': 'error',
      semi: ['error', 'always'],
      'no-empty-function': 'error',
      'max-params': ['error', 3],
      'no-global-assign': 'error',
      'no-magic-numbers': ['error', { ignoreArrayIndexes: true }],
      'no-use-before-define': ['error', { functions: false }],
      'no-empty-pattern': 'error',
      'no-swap-vars-on-destructure': 'error',
      'import/no-namespace': 'error',
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);
