import type { NewTask, Task, TaskFilter, TaskPatch, TaskRepository } from '../../src/tasks/task.js';

/** Repositório em memória usado nos testes unitários (sem banco de dados). */
export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];
  private nextId = 1;

  list(filter: TaskFilter): Promise<Task[]> {
    const result = this.tasks.filter(
      (task) => filter.done === undefined || task.done === filter.done,
    );
    return Promise.resolve(result.map((task) => ({ ...task })));
  }

  findById(id: number): Promise<Task | null> {
    const task = this.tasks.find((item) => item.id === id);
    return Promise.resolve(task ? { ...task } : null);
  }

  create(data: NewTask): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: this.nextId++,
      title: data.title,
      description: data.description ?? null,
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.push(task);
    return Promise.resolve({ ...task });
  }

  update(id: number, patch: TaskPatch): Promise<Task | null> {
    const task = this.tasks.find((item) => item.id === id);
    if (!task) return Promise.resolve(null);
    if (patch.title !== undefined) task.title = patch.title;
    if (patch.description !== undefined) task.description = patch.description;
    if (patch.done !== undefined) task.done = patch.done;
    task.updatedAt = new Date().toISOString();
    return Promise.resolve({ ...task });
  }

  remove(id: number): Promise<boolean> {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((task) => task.id !== id);
    return Promise.resolve(this.tasks.length < before);
  }
}
