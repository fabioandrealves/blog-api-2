import { z } from 'zod';

const positiveId = z.coerce.number().int().positive();

export const commentIdSchema = z.object({
  id: positiveId,
});

export const commentPostIdSchema = z.object({
  postId: positiveId,
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, {
    message: 'O comentário não pode estar vazio.',
  }),
});

export const updateCommentSchema = createCommentSchema;

