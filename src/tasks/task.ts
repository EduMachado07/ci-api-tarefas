export interface Task {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewTask {
  title: string;
  description?: string | null | undefined;
}

export interface TaskPatch {
  title?: string | undefined;
  description?: string | null | undefined;
  done?: boolean | undefined;
}

export interface TaskFilter {
  done?: boolean | undefined;
}

export interface TaskRepository {
  list(filter: TaskFilter): Promise<Task[]>;
  findById(id: number): Promise<Task | null>;
  create(data: NewTask): Promise<Task>;
  update(id: number, patch: TaskPatch): Promise<Task | null>;
  remove(id: number): Promise<boolean>;
}
