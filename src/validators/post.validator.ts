import { z } from 'zod';

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'O título deve possuir pelo menos 3 caracteres.')
    .max(255, 'O título deve possuir no máximo 255 caracteres.'),

  content: z
    .string()
    .trim()
    .min(10, 'O conteúdo deve possuir pelo menos 10 caracteres.'),
});

export const updatePostSchema = createPostSchema;

export const postIdSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, 'ID do post inválido.')
    .transform(Number),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
