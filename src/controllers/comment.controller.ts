import type { Request, Response } from 'express';
import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2';

import { database } from '../config/database.js';

import {
  commentIdSchema,
  commentPostIdSchema,
  createCommentSchema,
  updateCommentSchema,
} from '../validators/comment.validator.js';

interface AuthUser {
  id: number;
  role: 'student' | 'teacher' | 'admin';
}

interface CommentRow extends RowDataPacket {
  id: number;
  postId: number;
  userId: number;
  content: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CommentOwnerRow extends RowDataPacket {
  user_id: number;
}

interface PostExistsRow extends RowDataPacket {
  id: number;
}

function getAuthUser(response: Response): AuthUser {
  return response.locals.authUser as AuthUser;
}

function getCommentId(
  request: Request,
  response: Response,
): number | null {
  const result = commentIdSchema.safeParse(request.params);

  if (!result.success) {
    response.status(400).json({
      message: 'ID do comentário inválido.',
      errors: result.error.flatten().fieldErrors,
    });

    return null;
  }

  return result.data.id;
}

function getPostId(
  request: Request,
  response: Response,
): number | null {
  const result = commentPostIdSchema.safeParse(request.params);

  if (!result.success) {
    response.status(400).json({
      message: 'ID do post inválido.',
      errors: result.error.flatten().fieldErrors,
    });

    return null;
  }

  return result.data.postId;
}

const commentSelect = `
  SELECT
    c.id,
    c.post_id AS postId,
    c.user_id AS userId,
    c.content,
    u.name AS authorName,
    c.created_at AS createdAt,
    c.updated_at AS updatedAt
  FROM comments c
  INNER JOIN users u ON u.id = c.user_id
`;

// GET /api/v1/posts/:postId/comments
export async function listCommentsByPost(
  request: Request,
  response: Response,
): Promise<void> {
  const postId = getPostId(request, response);

  if (postId === null) return;

  try {
    const [posts] = await database.execute<PostExistsRow[]>(
      'SELECT id FROM posts WHERE id = ? LIMIT 1',
      [postId],
    );

    if (posts.length === 0) {
      response.status(404).json({
        message: 'Post não encontrado.',
      });
      return;
    }

    const [comments] = await database.execute<CommentRow[]>(
      `
        ${commentSelect}
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC, c.id ASC
      `,
      [postId],
    );

    response.status(200).json({
      message: 'Comentários encontrados com sucesso.',
      data: { comments },
    });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);

    response.status(500).json({
      message: 'Não foi possível carregar os comentários.',
    });
  }
}

// GET /api/v1/comments/:id
export async function getCommentById(
  request: Request,
  response: Response,
): Promise<void> {
  const id = getCommentId(request, response);

  if (id === null) return;

  try {
    const [comments] = await database.execute<CommentRow[]>(
      `
        ${commentSelect}
        WHERE c.id = ?
        LIMIT 1
      `,
      [id],
    );

    if (comments.length === 0) {
      response.status(404).json({
        message: 'Comentário não encontrado.',
      });
      return;
    }

    response.status(200).json({
      message: 'Comentário encontrado com sucesso.',
      data: { comment: comments[0] },
    });
  } catch (error) {
    console.error('Erro ao consultar comentário:', error);

    response.status(500).json({
      message: 'Não foi possível consultar o comentário.',
    });
  }
}

// POST /api/v1/posts/:postId/comments
export async function createComment(
  request: Request,
  response: Response,
): Promise<void> {
  const postId = getPostId(request, response);

  if (postId === null) return;

  const validation = createCommentSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const user = getAuthUser(response);

    const [posts] = await database.execute<PostExistsRow[]>(
      'SELECT id FROM posts WHERE id = ? LIMIT 1',
      [postId],
    );

    if (posts.length === 0) {
      response.status(404).json({
        message: 'Post não encontrado.',
      });
      return;
    }

    const [result] = await database.execute<ResultSetHeader>(
      `
        INSERT INTO comments (post_id, user_id, content)
        VALUES (?, ?, ?)
      `,
      [postId, user.id, validation.data.content],
    );

    const [comments] = await database.execute<CommentRow[]>(
      `
        ${commentSelect}
        WHERE c.id = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    response.status(201).json({
      message: 'Comentário criado com sucesso.',
      data: { comment: comments[0] },
    });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);

    response.status(500).json({
      message: 'Não foi possível criar o comentário.',
    });
  }
}

// PUT /api/v1/comments/:id
export async function updateComment(
  request: Request,
  response: Response,
): Promise<void> {
  const id = getCommentId(request, response);

  if (id === null) return;

  const validation = updateCommentSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const user = getAuthUser(response);

    const [existingComments] =
      await database.execute<CommentOwnerRow[]>(
        `
          SELECT user_id
          FROM comments
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    if (existingComments.length === 0) {
      response.status(404).json({
        message: 'Comentário não encontrado.',
      });
      return;
    }

    if (existingComments[0].user_id !== user.id) {
      response.status(403).json({
        message:
          'Você não tem permissão para editar este comentário.',
      });
      return;
    }

    await database.execute<ResultSetHeader>(
      `
        UPDATE comments
        SET content = ?
        WHERE id = ? AND user_id = ?
      `,
      [validation.data.content, id, user.id],
    );

    const [comments] = await database.execute<CommentRow[]>(
      `
        ${commentSelect}
        WHERE c.id = ?
        LIMIT 1
      `,
      [id],
    );

    response.status(200).json({
      message: 'Comentário atualizado com sucesso.',
      data: { comment: comments[0] },
    });
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);

    response.status(500).json({
      message: 'Não foi possível atualizar o comentário.',
    });
  }
}

// DELETE /api/v1/comments/:id
export async function deleteComment(
  request: Request,
  response: Response,
): Promise<void> {
  const id = getCommentId(request, response);

  if (id === null) return;

  try {
    const user = getAuthUser(response);

    const [existingComments] =
      await database.execute<CommentOwnerRow[]>(
        `
          SELECT user_id
          FROM comments
          WHERE id = ?
          LIMIT 1
        `,
        [id],
      );

    if (existingComments.length === 0) {
      response.status(404).json({
        message: 'Comentário não encontrado.',
      });
      return;
    }

    if (existingComments[0].user_id !== user.id) {
      response.status(403).json({
        message:
          'Você não tem permissão para excluir este comentário.',
      });
      return;
    }

    await database.execute<ResultSetHeader>(
      `
        DELETE FROM comments
        WHERE id = ? AND user_id = ?
      `,
      [id, user.id],
    );

    response.status(200).json({
      message: 'Comentário excluído com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);

    response.status(500).json({
      message: 'Não foi possível excluir o comentário.',
    });
  }
}

