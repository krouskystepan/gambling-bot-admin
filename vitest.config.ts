import { defineConfig } from 'vitest/config'

import path from 'node:path'

/** 100% coverage on src/lib/** (utils/functions). Components/features/actions are out of scope. */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
    slowTestThreshold: 60_000,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/**/index.ts',
        // Presentation/demo mode is out of coverage scope.
        'src/lib/presentation/**'
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100
      }
    }
  }
})
