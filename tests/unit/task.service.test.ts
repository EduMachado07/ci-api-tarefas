import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError } from '../../src/errors.js';
import { TaskService } from '../../src/tasks/task.service.js';
import { InMemoryTaskRepository } from '../helpers/in-memory-task-repository.js';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    service = new TaskService(new InMemoryTaskRepository());
  });

  it('cria uma tarefa em aberto', async () => {
    const task = await service.create({ title: 'Estudar CI', description: 'GitHub Actions' });

    expect(task).toMatchObject({
      id: 1,
      title: 'Estudar CI',
      description: 'GitHub Actions',
      done: false,
    });
  });

  it('rejeita título duplicado entre tarefas em aberto, ignorando caixa e espaços', async () => {
    await service.create({ title: 'Escrever relatório' });

    await expect(service.create({ title: '  escrever RELATÓRIO ' })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('permite reutilizar o título de uma tarefa já concluída', async () => {
    const first = await service.create({ title: 'Revisar código' });
    await service.update(first.id, { done: true });

    const second = await service.create({ title: 'Revisar código' });

    expect(second.id).not.toBe(first.id);
  });

  it('busca tarefa existente e lança NotFoundError para id inexistente', async () => {
    const created = await service.create({ title: 'Ler logs' });

    await expect(service.get(created.id)).resolves.toMatchObject({ title: 'Ler logs' });
    await expect(service.get(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('filtra a listagem por situação', async () => {
    const a = await service.create({ title: 'A' });
    await service.create({ title: 'B' });
    await service.update(a.id, { done: true });

    expect(await service.list()).toHaveLength(2);
    expect(await service.list({ done: true })).toHaveLength(1);
    expect(await service.list({ done: false })).toHaveLength(1);
  });

  it('atualiza campos e permite manter o próprio título', async () => {
    const task = await service.create({ title: 'Configurar lint' });

    const updated = await service.update(task.id, { title: 'Configurar lint', done: true });

    expect(updated.done).toBe(true);
  });

  it('não permite renomear para o título de outra tarefa em aberto', async () => {
    await service.create({ title: 'Primeira' });
    const second = await service.create({ title: 'Segunda' });

    await expect(service.update(second.id, { title: 'primeira' })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('lança NotFoundError ao atualizar ou remover tarefa inexistente', async () => {
    await expect(service.update(42, { done: true })).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.remove(42)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('remove uma tarefa existente', async () => {
    const task = await service.create({ title: 'Descartável' });

    await service.remove(task.id);

    await expect(service.get(task.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
