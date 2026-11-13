import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      // Camadas que dependem de infraestrutura real são cobertas pelos testes de integração.
      exclude: ['src/server.ts', 'src/db/**', 'src/tasks/task.pg-repository.ts'],
      thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
    },
  },
});
