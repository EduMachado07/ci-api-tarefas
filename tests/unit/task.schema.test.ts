import { describe, expect, it } from 'vitest';
import {
  createTaskSchema,
  idParamSchema,
  listQuerySchema,
  updateTaskSchema,
} from '../../src/tasks/task.schema.js';

describe('createTaskSchema', () => {
  it('aceita título válido e remove espaços nas pontas', () => {
    const result = createTaskSchema.parse({ title: '  Nova tarefa  ' });
    expect(result.title).toBe('Nova tarefa');
  });

  it.each([
    ['título vazio', { title: '   ' }],
    ['título ausente', {}],
    ['título longo demais', { title: 'x'.repeat(121) }],
    ['campo desconhecido', { title: 'ok', admin: true }],
    ['descrição longa demais', { title: 'ok', description: 'x'.repeat(2001) }],
  ])('rejeita %s', (_name, input) => {
    expect(createTaskSchema.safeParse(input).success).toBe(false);
  });
});

describe('updateTaskSchema', () => {
  it('exige ao menos um campo', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(updateTaskSchema.safeParse({ done: true }).success).toBe(true);
  });

  it('rejeita tipos incorretos', () => {
    expect(updateTaskSchema.safeParse({ done: 'sim' }).success).toBe(false);
  });
});

describe('idParamSchema', () => {
  it('converte texto numérico em inteiro positivo', () => {
    expect(idParamSchema.parse('7')).toBe(7);
  });

  it.each(['0', '-1', '1.5', 'abc'])('rejeita "%s"', (value) => {
    expect(idParamSchema.safeParse(value).success).toBe(false);
  });
});

describe('listQuerySchema', () => {
  it('converte done=true/false em booleano', () => {
    expect(listQuerySchema.parse({ done: 'true' })).toEqual({ done: true });
    expect(listQuerySchema.parse({ done: 'false' })).toEqual({ done: false });
    expect(listQuerySchema.parse({})).toEqual({});
  });

  it('rejeita valores fora do esperado', () => {
    expect(listQuerySchema.safeParse({ done: 'talvez' }).success).toBe(false);
  });
});
