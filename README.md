# ci-api-tarefas

API REST de tarefas (Node.js, TypeScript, Express 5 e PostgreSQL) criada para a **Atividade 2** de
Integração Contínua: a aplicação serve de base para um pipeline de CI com GitHub Actions disparado
por Pull Request.

## Endpoints

| Método e rota       | Descrição                                          | Respostas          |
| ------------------- | -------------------------------------------------- | ------------------ |
| `GET /health`       | Verificação de saúde (não depende do banco)        | 200                |
| `GET /tasks`        | Lista tarefas; filtro opcional `?done=true\|false` | 200, 400           |
| `GET /tasks/:id`    | Busca uma tarefa                                   | 200, 400, 404      |
| `POST /tasks`       | Cria uma tarefa (`title`, `description?`)          | 201, 400, 409      |
| `PATCH /tasks/:id`  | Atualiza `title`, `description` e/ou `done`        | 200, 400, 404, 409 |
| `DELETE /tasks/:id` | Remove uma tarefa                                  | 204, 400, 404      |

Regra de negócio: não pode haver duas tarefas **em aberto** com o mesmo título (409).

## Executando localmente

```bash
docker compose up -d db                       # PostgreSQL 16
cp .env.example .env && export $(cat .env)    # DATABASE_URL e PORT
npm ci
npm run db:migrate                            # aplica as migrations SQL
npm run dev                                   # API em http://localhost:3000
```

## Scripts

| Script                     | O que faz                                           |
| -------------------------- | --------------------------------------------------- |
| `npm run format:check`     | Verifica a formatação (Prettier)                    |
| `npm run lint`             | Análise estática (ESLint com regras que usam tipos) |
| `npm run typecheck`        | Checagem de tipos (`tsc --noEmit`)                  |
| `npm run build`            | Compila para `dist/`                                |
| `npm run test:unit`        | Testes unitários com cobertura (sem banco de dados) |
| `npm run test:integration` | Testes de integração (exige `DATABASE_URL`)         |
| `npm run db:migrate`       | Aplica as migrations de `migrations/`               |

## Imagem Docker

```bash
docker build -t ci-api-tarefas .
docker run --rm -p 3000:3000 -e DATABASE_URL=postgresql://app:app@host:5432/tarefas ci-api-tarefas
```

## Integração Contínua (GitHub Actions)

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo **Pull Request**
com destino à `main`. Os jobs são encadeados com `needs`: se um falha, os seguintes são ignorados.

| #   | Job                              | O que executa                                                          |
| --- | -------------------------------- | ---------------------------------------------------------------------- |
| 1   | Análise estática e de formatação | Prettier (`--check`), ESLint e `tsc --noEmit`                          |
| 2   | Análise estática de segurança    | `npm audit` (dependências) e CodeQL (SAST), reprova em severidade alta |
| 3   | Build                            | `tsc` gerando `dist/`                                                  |
| 4   | Testes unitários                 | Vitest com cobertura (limite mínimo configurado)                       |
| 5   | Testes de integração             | Vitest contra um PostgreSQL 16 real (service container)                |
| 6   | Criação da imagem Docker         | Build do Dockerfile, teste de fumaça em `/health` e artefato           |

A imagem **não é publicada** no PR; a publicação ficaria a cargo de um workflow de CD após o merge.
