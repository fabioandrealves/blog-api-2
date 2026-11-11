import type { Request, Response } from 'express';
import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2';

import { database } from '../config/database.js';
import {
  createPostSchema,
  postIdSchema,
  updatePostSchema,
} from '../validators/post.validator.js';

interface AuthUser {
  id: number;
  role: 'student' | 'teacher' | 'admin';
}

interface PostRow extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  userId: number;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PostOwnerRow extends RowDataPacket {
  user_id: number;
}

function getAuthUser(response: Response): AuthUser {
  return response.locals.authUser as AuthUser;
}

function getPostId(request: Request, response: Response): number | null {
  const result = postIdSchema.safeParse(request.params);

  if (!result.success) {
    response.status(400).json({
      message: 'ID do post inválido.',
      errors: result.error.flatten().fieldErrors,
    });

    return null;
  }

  return result.data.id;
}

// GET /api/v1/posts
export async function listPosts(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const [posts] = await database.execute<PostRow[]>(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.user_id AS userId,
        u.name AS authorName,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM posts p
      INNER JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
    `);

    response.status(200).json({
      message: 'Posts encontrados com sucesso.',
      data: { posts },
    });
  } catch (error) {
    console.error('Erro ao listar posts:', error);

    response.status(500).json({
      message: 'Não foi possível carregar os posts.',
    });
  }
}

// GET /api/v1/posts/me
export async function listMyPosts(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const user = getAuthUser(response);

    const [posts] = await database.execute<PostRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.content,
          p.user_id AS userId,
          u.name AS authorName,
          p.created_at AS createdAt,
          p.updated_at AS updatedAt
        FROM posts p
        INNER JOIN users u ON u.id = p.user_id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `,
      [user.id],
    );

    response.status(200).json({
      message: 'Seus posts foram encontrados com sucesso.',
      data: { posts },
    });
  } catch (error) {
    console.error('Erro ao listar posts do professor:', error);

    response.status(500).json({
      message: 'Não foi possível carregar seus posts.',
    });
  }
}

// GET /api/v1/posts/:id
export async function getPostById(
  request: Request,
  response: Response,
): Promise<void> {
  const id = getPostId(request, response);

  if (id === null) return;

  try {
    const [posts] = await database.execute<PostRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.content,
          p.user_id AS userId,
          u.name AS authorName,
          p.created_at AS createdAt,
          p.updated_at AS updatedAt
        FROM posts p
        INNER JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
        LIMIT 1
      `,
      [id],
    );

    if (posts.length === 0) {
      response.status(404).json({
        message: 'Post não encontrado.',
      });

      return;
    }

    response.status(200).json({
      message: 'Post encontrado com sucesso.',
      data: { post: posts[0] },
    });
  } catch (error) {
    console.error('Erro ao consultar post:', error);

    response.status(500).json({
      message: 'Não foi possível consultar o post.',
    });
  }
}

// POST /api/v1/posts
export async function createPost(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createPostSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const user = getAuthUser(response);
    const { title, content } = validation.data;

    const [result] = await database.execute<ResultSetHeader>(
      `
        INSERT INTO posts (user_id, title, content)
        VALUES (?, ?, ?)
      `,
      [user.id, title, content],
    );

    const [posts] = await database.execute<PostRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.content,
          p.user_id AS userId,
          u.name AS authorName,
          p.created_at AS createdAt,
          p.updated_at AS updatedAt
        FROM posts p
        INNER JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
        LIMIT 1
      `,
      [result.insertId],
    );

    response.status(201).json({
      message: 'Post criado com sucesso.',
      data: { post: posts[0] },
    });
  } catch (error) {
    console.error('Erro ao criar post:', error);

    response.status(500).json({
      message: 'Não foi possível criar o post.',
    });
  }
}

// PUT /api/v1/posts/:id
export async function updatePost(
  request: Request,
  response: Response,
): Promise<void> {
  const id = getPostId(request, response);

  if (id === null) return;

  const validation = updatePostSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const user = getAuthUser(response);
    const { title, content } = validation.data;

    const [existingPosts] = await database.execute<PostOwnerRow[]>(
      'SELECT user_id FROM posts WHERE id = ? LIMIT 1',
      [id],
    );

    if (existingPosts.length === 0) {
      response.status(404).json({
        message: 'Post não encontrado.',
      });

      return;
    }

    if (existingPosts[0].user_id !== user.id) {
      response.status(403).json({
        message: 'Você não tem permissão para editar este post.',
      });

      return;
    }

    await database.execute<ResultSetHeader>(
      `
        UPDATE posts
        SET title = ?, content = ?
        WHERE id = ? AND user_id = ?
      `,
      [title, content, id, user.id],
    );

    const [posts] = await database.execute<PostRow[]>(
      `
        SELECT
          p.id,
          p.title,
          p.content,
          p.user_id AS userId,
          u.name AS authorName,
          p.created_at AS createdAt,
          p.updated_at AS updatedAt
        FROM posts p
        INNER JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
        LIMIT 1
      `,
      [id],
    );

    response.status(200).json({
      message: 'Post atualizado com sucesso.',
      data: { post: posts[0] },
    });
  } catch (error) {
    console.error('Erro ao atualizar post:', error);

    response.status(500).json({
      message: 'Não foi possível atualizar o post.',
    });
  }
}

// DELETE /api/v1/posts/:id
export async function deletePost(
  request: Request,
  response: Response,
): Promise<void> {
  const id = getPostId(request, response);

  if (id === null) return;

  try {
    const user = getAuthUser(response);

    const [existingPosts] = await database.execute<PostOwnerRow[]>(
      'SELECT user_id FROM posts WHERE id = ? LIMIT 1',
      [id],
    );

    if (existingPosts.length === 0) {
      response.status(404).json({
        message: 'Post não encontrado.',
      });

      return;
    }

    if (existingPosts[0].user_id !== user.id) {
      response.status(403).json({
        message: 'Você não tem permissão para excluir este post.',
      });

      return;
    }

    await database.execute<ResultSetHeader>(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [id, user.id],
    );

    response.status(200).json({
      message: 'Post excluído com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir post:', error);

    response.status(500).json({
      message: 'Não foi possível excluir o post.',
    });
  }
}

