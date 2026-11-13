import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../../src/db/migrate.js';
import { createTestApp, createTestPool } from './setup.js';

describe('API de tarefas com PostgreSQL real', () => {
  let pool: pg.Pool;
  let app: ReturnType<typeof createTestApp>;

  beforeAll(async () => {
    pool = createTestPool();
    await runMigrations(pool);
    app = createTestApp(pool);
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE tasks RESTART IDENTITY');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('persiste e recupera uma tarefa (POST + GET)', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Integrar com o banco', description: 'PostgreSQL 16' });

    expect(created.status).toBe(201);

    const fetched = await request(app).get(`/tasks/${created.body.id as number}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body).toMatchObject({
      title: 'Integrar com o banco',
      description: 'PostgreSQL 16',
      done: false,
    });

    const { rows } = await pool.query('SELECT count(*)::int AS total FROM tasks');
    expect(rows[0]).toEqual({ total: 1 });
  });

  it('atualiza campos e renova updated_at (PATCH)', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Atualizar' });
    const id = created.body.id as number;

    const patched = await request(app)
      .patch(`/tasks/${id}`)
      .send({ done: true, description: null });

    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ id, done: true, description: null });
    expect(new Date(patched.body.updatedAt as string).getTime()).toBeGreaterThanOrEqual(
      new Date(created.body.createdAt as string).getTime(),
    );
  });

  it('filtra por situação usando o banco (?done=)', async () => {
    await request(app).post('/tasks').send({ title: 'Aberta' });
    const concluded = await request(app).post('/tasks').send({ title: 'Concluída' });
    await request(app)
      .patch(`/tasks/${concluded.body.id as number}`)
      .send({ done: true });

    const done = await request(app).get('/tasks').query({ done: 'true' });
    const open = await request(app).get('/tasks').query({ done: 'false' });
    const all = await request(app).get('/tasks');

    expect((done.body as unknown[]).length).toBe(1);
    expect((open.body as unknown[]).length).toBe(1);
    expect((all.body as unknown[]).length).toBe(2);
  });

  it('remove a tarefa (DELETE) e responde 404 depois', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Remover' });
    const id = created.body.id as number;

    expect((await request(app).delete(`/tasks/${id}`)).status).toBe(204);
    expect((await request(app).get(`/tasks/${id}`)).status).toBe(404);
    expect((await request(app).delete(`/tasks/${id}`)).status).toBe(404);
  });

  it('aplica a regra de título duplicado com dados reais (409)', async () => {
    await request(app).post('/tasks').send({ title: 'Única' });
    const duplicate = await request(app).post('/tasks').send({ title: 'ÚNICA' });

    expect(duplicate.status).toBe(409);
  });

  it('respeita a restrição de tamanho do título (VARCHAR(120)) via validação', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'x'.repeat(121) });

    expect(res.status).toBe(400);
  });

  it('trata entrada maliciosa como texto (consultas parametrizadas)', async () => {
    const payload = "'; DROP TABLE tasks; --";

    const created = await request(app).post('/tasks').send({ title: payload });
    const list = await request(app).get('/tasks');

    expect(created.status).toBe(201);
    expect((list.body as { title: string }[])[0]?.title).toBe(payload);
    const { rows } = await pool.query("SELECT to_regclass('public.tasks') AS tabela");
    expect(rows[0]).toEqual({ tabela: 'tasks' });
  });
});
