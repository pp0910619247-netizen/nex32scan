import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      // The gate covers the unit-testable layer: the pure `lib/` modules (data
      // source selection, payload mapping, sorting, formatting) and the i18n
      // dictionaries. The App Router pages and React components need a browser
      // runner, which is not wired yet — listing them here would drop the gate
      // to ~23% and hide the modules that are actually covered.
      include: ['src/lib/**/*.ts', 'src/i18n/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
