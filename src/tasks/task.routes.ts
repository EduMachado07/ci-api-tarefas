import { Router } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../errors.js';
import {
  createTaskSchema,
  idParamSchema,
  listQuerySchema,
  updateTaskSchema,
} from './task.schema.js';
import type { TaskService } from './task.service.js';

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}

export function taskRouter(service: TaskService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const query = parse(listQuerySchema, req.query);
    res.json(await service.list(query));
  });

  router.get('/:id', async (req, res) => {
    const id = parse(idParamSchema, req.params.id);
    res.json(await service.get(id));
  });

  router.post('/', async (req, res) => {
    const body = parse(createTaskSchema, req.body);
    const task = await service.create(body);
    res.status(201).location(`/tasks/${task.id}`).json(task);
  });

  router.patch('/:id', async (req, res) => {
    const id = parse(idParamSchema, req.params.id);
    const body = parse(updateTaskSchema, req.body);
    res.json(await service.update(id, body));
  });

  router.delete('/:id', async (req, res) => {
    const id = parse(idParamSchema, req.params.id);
    await service.remove(id);
    res.status(204).end();
  });

  return router;
}
