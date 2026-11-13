import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../../src/db/migrate.js';
import { createTestPool } from './setup.js';

describe('migrations', () => {
  let pool: pg.Pool;

  beforeAll(() => {
    pool = createTestPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('é idempotente: a segunda execução não aplica nada', async () => {
    await runMigrations(pool);
    const second = await runMigrations(pool);

    expect(second).toEqual([]);
  });

  it('cria a tabela tasks com as colunas esperadas', async () => {
    await runMigrations(pool);

    const { rows } = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'tasks' ORDER BY ordinal_position`,
    );

    expect(rows.map((row) => row.column_name)).toEqual([
      'id',
      'title',
      'description',
      'done',
      'created_at',
      'updated_at',
    ]);
  });
});
