import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vueEslint from 'eslint-plugin-vue';
import astroEslint from 'eslint-plugin-astro';

export default [
  // Base JavaScript rules
  js.configs.recommended,
  
  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-const': 'error',
    },
  },
  
  // Vue configuration
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueEslint.parser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      vue: vueEslint,
    },
    rules: {
      ...vueEslint.configs['vue3-recommended'].rules,
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/script-setup-uses-vars': 'error',
    },
  },
  
  // Astro configuration
  {
    files: ['**/*.astro'],
    plugins: {
      astro: astroEslint,
    },
    rules: {
      ...astroEslint.configs.recommended.rules,
    },
  },
  
  // Global rules
  {
    files: ['**/*.{js,jsx,ts,tsx,vue,astro}'],
    rules: {
      // Security
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error',
      
      // Best practices
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Code style
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '.astro/**',
      'public/**',
    ],
  },
];