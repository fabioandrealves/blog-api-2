import { z } from 'zod';

export const managedUserIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateManagedUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),

    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform(value => value.toLowerCase())
      .optional(),
  })
  .strict()
  .refine(
    data => data.name !== undefined || data.email !== undefined,
    {
      message: 'Informe pelo menos um campo para atualizar.',
    },
  );