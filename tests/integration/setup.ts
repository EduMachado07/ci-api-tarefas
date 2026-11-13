import type pg from 'pg';
import { createApp } from '../../src/app.js';
import { createPool } from '../../src/db/pool.js';
import { PgTaskRepository } from '../../src/tasks/task.pg-repository.js';
import { TaskService } from '../../src/tasks/task.service.js';

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL é obrigatória para os testes de integração');
  }
  return url;
}

export function createTestPool(): pg.Pool {
  return createPool(databaseUrl());
}

export function createTestApp(pool: pg.Pool): ReturnType<typeof createApp> {
  return createApp({ taskService: new TaskService(new PgTaskRepository(pool)) });
}
