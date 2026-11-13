import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { loadConfig } from '../config.js';
import { createPool } from './pool.js';

export const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../../migrations');

/** Aplica, em ordem, as migrations .sql ainda não registradas. Retorna os nomes aplicados. */
export async function runMigrations(
  pool: pg.Pool,
  directory: string = MIGRATIONS_DIR,
): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.name));
  const executed: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(directory, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      executed.push(file);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  return executed;
}

// Execução direta: `npm run db:migrate` ou `node dist/db/migrate.js`.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = createPool(loadConfig().databaseUrl);
  runMigrations(pool)
    .then((executed) => {
      console.info(
        executed.length > 0
          ? `Migrations aplicadas: ${executed.join(', ')}`
          : 'Banco já atualizado',
      );
    })
    .catch((error: unknown) => {
      console.error('Falha ao aplicar migrations', error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
