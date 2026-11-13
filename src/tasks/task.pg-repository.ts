import type pg from 'pg';
import type { NewTask, Task, TaskFilter, TaskPatch, TaskRepository } from './task.js';

interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  created_at: Date;
  updated_at: Date;
}

const COLUMNS = 'id, title, description, done, created_at, updated_at';

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    done: row.done,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PgTaskRepository implements TaskRepository {
  constructor(private readonly pool: pg.Pool) {}

  async list(filter: TaskFilter): Promise<Task[]> {
    const { rows } = await this.pool.query<TaskRow>(
      `SELECT ${COLUMNS} FROM tasks WHERE ($1::boolean IS NULL OR done = $1) ORDER BY id`,
      [filter.done ?? null],
    );
    return rows.map(toTask);
  }

  async findById(id: number): Promise<Task | null> {
    const { rows } = await this.pool.query<TaskRow>(`SELECT ${COLUMNS} FROM tasks WHERE id = $1`, [
      id,
    ]);
    return rows[0] ? toTask(rows[0]) : null;
  }

  async create(data: NewTask): Promise<Task> {
    const { rows } = await this.pool.query<TaskRow>(
      `INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING ${COLUMNS}`,
      [data.title, data.description ?? null],
    );
    return toTask(rows[0] as TaskRow);
  }

  async update(id: number, patch: TaskPatch): Promise<Task | null> {
    // Os nomes das colunas vêm de uma lista fixa; os valores sempre vão como parâmetros ($n).
    const assignments: string[] = [];
    const values: unknown[] = [];
    const fields: [string, unknown][] = [
      ['title', patch.title],
      ['description', patch.description],
      ['done', patch.done],
    ];
    for (const [column, value] of fields) {
      if (value !== undefined) {
        values.push(value);
        assignments.push(`${column} = $${values.length}`);
      }
    }
    if (assignments.length === 0) return this.findById(id);

    values.push(id);
    const { rows } = await this.pool.query<TaskRow>(
      `UPDATE tasks SET ${assignments.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length} RETURNING ${COLUMNS}`,
      values,
    );
    return rows[0] ? toTask(rows[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
