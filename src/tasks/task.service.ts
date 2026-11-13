import { ConflictError, NotFoundError } from '../errors.js';
import type { NewTask, Task, TaskFilter, TaskPatch, TaskRepository } from './task.js';

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  list(filter: TaskFilter = {}): Promise<Task[]> {
    return this.repository.list(filter);
  }

  async get(id: number): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) throw new NotFoundError('Tarefa', id);
    return task;
  }

  async create(data: NewTask): Promise<Task> {
    await this.assertNoOpenTaskWithTitle(data.title);
    return this.repository.create(data);
  }

  async update(id: number, patch: TaskPatch): Promise<Task> {
    if (patch.title !== undefined) {
      await this.assertNoOpenTaskWithTitle(patch.title, id);
    }
    const task = await this.repository.update(id, patch);
    if (!task) throw new NotFoundError('Tarefa', id);
    return task;
  }

  async remove(id: number): Promise<void> {
    const removed = await this.repository.remove(id);
    if (!removed) throw new NotFoundError('Tarefa', id);
  }

  /** Regra de negócio: não pode haver duas tarefas em aberto com o mesmo título. */
  private async assertNoOpenTaskWithTitle(title: string, ignoreId?: number): Promise<void> {
    const openTasks = await this.repository.list({ done: false });
    const normalized = title.trim().toLowerCase();
    const duplicate = openTasks.some(
      (task) => task.id !== ignoreId && task.title.trim().toLowerCase() === normalized,
    );
    if (duplicate) {
      throw new ConflictError(`Já existe uma tarefa em aberto com o título "${title}"`);
    }
  }
}
