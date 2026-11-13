import { z } from 'zod';

const title = z.string().trim().min(1, 'título é obrigatório').max(120, 'título muito longo');
const description = z.string().max(2000, 'descrição muito longa').nullable();

export const createTaskSchema = z.strictObject({
  title,
  description: description.optional(),
});

export const updateTaskSchema = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    done: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'informe ao menos um campo para atualizar',
  });

export const idParamSchema = z.coerce.number().int().positive();

export const listQuerySchema = z.strictObject({
  done: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
