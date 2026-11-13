import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db/pool.js';
import { PgTaskRepository } from './tasks/task.pg-repository.js';
import { TaskService } from './tasks/task.service.js';

const config = loadConfig();
const pool = createPool(config.databaseUrl);
const app = createApp({ taskService: new TaskService(new PgTaskRepository(pool)) });

const server = app.listen(config.port, () => {
  console.info(`API de tarefas ouvindo na porta ${config.port}`);
});

function shutdown(signal: string): void {
  console.info(`${signal} recebido, encerrando...`);
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
