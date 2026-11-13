import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { TaskService } from '../../src/tasks/task.service.js';
import { InMemoryTaskRepository } from '../helpers/in-memory-task-repository.js';

describe('API de tarefas (camada HTTP, repositório em memória)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp({ taskService: new TaskService(new InMemoryTaskRepository()) });
  });

  it('GET /health responde 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  it('POST /tasks cria e retorna 201 com Location', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Escrever testes' });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('/tasks/1');
    expect(res.body).toMatchObject({ id: 1, title: 'Escrever testes', done: false });
  });

  it('POST /tasks valida o corpo (400 com detalhes)', async () => {
    const res = await request(app).post('/tasks').send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveLength(1);
  });

  it('POST /tasks com JSON malformado responde 400', async () => {
    const res = await request(app)
      .post('/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('POST /tasks com título repetido responde 409', async () => {
    await request(app).post('/tasks').send({ title: 'Repetida' });
    const res = await request(app).post('/tasks').send({ title: 'repetida' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('GET /tasks/:id responde 404 para id inexistente e 400 para id inválido', async () => {
    expect((await request(app).get('/tasks/99')).status).toBe(404);
    expect((await request(app).get('/tasks/abc')).status).toBe(400);
  });

  it('GET /tasks aceita o filtro ?done=', async () => {
    await request(app).post('/tasks').send({ title: 'A' });
    await request(app).post('/tasks').send({ title: 'B' });
    await request(app).patch('/tasks/1').send({ done: true });

    const done = await request(app).get('/tasks').query({ done: 'true' });
    const open = await request(app).get('/tasks').query({ done: 'false' });
    const invalid = await request(app).get('/tasks').query({ done: 'talvez' });

    expect(done.body).toHaveLength(1);
    expect(open.body).toHaveLength(1);
    expect(invalid.status).toBe(400);
  });

  it('PATCH /tasks/:id atualiza e DELETE /tasks/:id remove (204)', async () => {
    await request(app).post('/tasks').send({ title: 'Ciclo de vida' });

    const patched = await request(app).patch('/tasks/1').send({ done: true });
    const deleted = await request(app).delete('/tasks/1');
    const after = await request(app).get('/tasks/1');

    expect(patched.body.done).toBe(true);
    expect(deleted.status).toBe(204);
    expect(after.status).toBe(404);
  });

  it('rota inexistente responde 404 em JSON', async () => {
    const res = await request(app).get('/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
