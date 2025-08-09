import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      'node_modules/**',
      'tests/e2e/**',
      '**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        'src/env.d.ts',
        'scripts/**',
        '.github/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/components/ReservationForm.vue': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/lib/database.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/pages/api/reservations.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
