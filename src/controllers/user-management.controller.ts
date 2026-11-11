
import type { Request, Response } from 'express';
import type {
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2';

import { database } from '../config/database.js';

import {
  managedUserIdSchema,
  updateManagedUserSchema,
} from '../validators/user-management.validator.js';

type ManagedRole = 'teacher' | 'student';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: ManagedRole;
  created_at: Date;
  updated_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

function toUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getUserId(
  request: Request,
  response: Response,
): number | null {
  const validation = managedUserIdSchema.safeParse(
    request.params,
  );

  if (!validation.success) {
    response.status(400).json({
      message: 'ID do usuário inválido.',
      errors: validation.error.flatten().fieldErrors,
    });

    return null;
  }

  return validation.data.id;
}

async function findUser(
  id: number,
  role: ManagedRole,
): Promise<UserRow | undefined> {
  const [rows] = await database.execute<UserRow[]>(
    `
      SELECT
        id,
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users
      WHERE id = ? AND role = ?
      LIMIT 1
    `,
    [id, role],
  );

  return rows[0];
}

function isDuplicateEmail(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ER_DUP_ENTRY'
  );
}

async function listUsers(
  response: Response,
  role: ManagedRole,
): Promise<void> {
  try {
    const [users] = await database.execute<UserRow[]>(
      `
        SELECT
          id,
          name,
          email,
          role,
          created_at,
          updated_at
        FROM users
        WHERE role = ?
        ORDER BY name ASC, id ASC
      `,
      [role],
    );

    response.status(200).json({
      message: 'Usuários encontrados com sucesso.',
      data: {
        users: users.map(toUser),
      },
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);

    response.status(500).json({
      message: 'Não foi possível carregar os usuários.',
    });
  }
}

async function updateUser(
  request: Request,
  response: Response,
  role: ManagedRole,
): Promise<void> {
  const id = getUserId(request, response);

  if (id === null) return;

  const validation = updateManagedUserSchema.safeParse(
    request.body,
  );

  if (!validation.success) {
    response.status(400).json({
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const existingUser = await findUser(id, role);

    if (!existingUser) {
      response.status(404).json({
        message: 'Usuário não encontrado.',
      });

      return;
    }

    const name =
      validation.data.name ?? existingUser.name;

    const email =
      validation.data.email ?? existingUser.email;

    const [result] =
      await database.execute<ResultSetHeader>(
        `
          UPDATE users
          SET name = ?, email = ?
          WHERE id = ? AND role = ?
        `,
        [name, email, id, role],
      );

    if (result.affectedRows === 0) {
      response.status(404).json({
        message: 'Usuário não encontrado.',
      });

      return;
    }

    const updatedUser = await findUser(id, role);

    if (!updatedUser) {
      response.status(404).json({
        message: 'Usuário não encontrado.',
      });

      return;
    }

    response.status(200).json({
      message: 'Usuário atualizado com sucesso.',
      data: {
        user: toUser(updatedUser),
      },
    });
  } catch (error) {
    if (isDuplicateEmail(error)) {
      response.status(409).json({
        message: 'Este e-mail já está cadastrado.',
      });

      return;
    }

    console.error('Erro ao atualizar usuário:', error);

    response.status(500).json({
      message: 'Não foi possível atualizar o usuário.',
    });
  }
}

async function deleteUser(
  request: Request,
  response: Response,
  role: ManagedRole,
): Promise<void> {
  const id = getUserId(request, response);

  if (id === null) return;

  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // Bloqueia o registro durante a operação.
    const [users] = await connection.execute<UserRow[]>(
      `
        SELECT
          id,
          name,
          email,
          role,
          created_at,
          updated_at
        FROM users
        WHERE id = ? AND role = ?
        LIMIT 1
        FOR UPDATE
      `,
      [id, role],
    );

    if (users.length === 0) {
      await connection.rollback();

      response.status(404).json({
        message: 'Usuário não encontrado.',
      });

      return;
    }

    const [posts] = await connection.execute<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM posts
        WHERE user_id = ?
      `,
      [id],
    );

    const [comments] =
      await connection.execute<CountRow[]>(
        `
          SELECT COUNT(*) AS total
          FROM comments
          WHERE user_id = ?
        `,
        [id],
      );

    if (
      Number(posts[0]?.total ?? 0) > 0 ||
      Number(comments[0]?.total ?? 0) > 0
    ) {
      await connection.rollback();

      response.status(409).json({
        message:
          'Este usuário possui posts ou comentários vinculados. ' +
          'Não é possível excluí-lo enquanto houver conteúdo associado.',
      });

      return;
    }

    const [result] =
      await connection.execute<ResultSetHeader>(
        `
          DELETE FROM users
          WHERE id = ? AND role = ?
        `,
        [id, role],
      );

    if (result.affectedRows === 0) {
      await connection.rollback();

      response.status(404).json({
        message: 'Usuário não encontrado.',
      });

      return;
    }

    await connection.commit();

    response.status(200).json({
      message: 'Usuário excluído com sucesso.',
    });
  } catch (error) {
    await connection.rollback();

    console.error('Erro ao excluir usuário:', error);

    response.status(500).json({
      message: 'Não foi possível excluir o usuário.',
    });
  } finally {
    connection.release();
  }
}

// ADMIN: professores

export async function listTeachers(
  _request: Request,
  response: Response,
): Promise<void> {
  await listUsers(response, 'teacher');
}

export async function updateTeacher(
  request: Request,
  response: Response,
): Promise<void> {
  await updateUser(request, response, 'teacher');
}

export async function deleteTeacher(
  request: Request,
  response: Response,
): Promise<void> {
  await deleteUser(request, response, 'teacher');
}

// TEACHER: estudantes

export async function listStudents(
  _request: Request,
  response: Response,
): Promise<void> {
  await listUsers(response, 'student');
}

export async function updateStudent(
  request: Request,
  response: Response,
): Promise<void> {
  await updateUser(request, response, 'student');
}

export async function deleteStudent(
  request: Request,
  response: Response,
): Promise<void> {
  await deleteUser(request, response, 'student');
}
