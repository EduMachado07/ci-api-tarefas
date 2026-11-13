import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';

describe('loadConfig', () => {
  it('usa a porta padrão 3000', () => {
    const config = loadConfig({ DATABASE_URL: 'postgresql://u:p@localhost:5432/db' });
    expect(config).toEqual({ port: 3000, databaseUrl: 'postgresql://u:p@localhost:5432/db' });
  });

  it('lê a porta informada', () => {
    expect(loadConfig({ DATABASE_URL: 'x', PORT: '8080' }).port).toBe(8080);
  });

  it('falha sem DATABASE_URL', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL');
  });

  it.each(['0', '70000', 'abc', '3.5'])('falha com PORT inválida (%s)', (port) => {
    expect(() => loadConfig({ DATABASE_URL: 'x', PORT: port })).toThrow('PORT inválida');
  });
});
