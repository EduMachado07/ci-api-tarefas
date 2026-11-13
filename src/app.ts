import express from 'express';
import type { ErrorRequestHandler, Express, RequestHandler } from 'express';
import { AppError } from './errors.js';
import { taskRouter } from './tasks/task.routes.js';
import type { TaskService } from './tasks/task.service.js';

export interface AppDependencies {
  taskService: TaskService;
}

const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada' } });
};

const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // Corpo JSON malformado (lançado pelo express.json).
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON inválido' } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno' } });
};

export function createApp({ taskService }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/tasks', taskRouter(taskService));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
