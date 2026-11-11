import type { Request, Response } from 'express';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getJwtSecret, getJwtExpiresIn } from '../config/jwt.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { database } from '../config/database.js';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: Date;
  updated_at: Date;
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});

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

export async function register(req: Request, res: Response) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const name = validation.data.name;
  const email = validation.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(validation.data.password, 12);

  try {
    const [result] = await database.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'student')`,
      [name, email, passwordHash],
    );

    const [rows] = await database.execute<UserRow[]>(
      `SELECT id, name, email, password_hash, role, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [result.insertId],
    );

    const user = rows[0];

    if (!user) {
      return res.status(500).json({
        message: 'Não foi possível recuperar o usuário cadastrado.',
      });
    }

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      data: {
        user: toUser(user),
      },
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    ) {
      return res.status(409).json({
        message: 'Este e-mail já está cadastrado.',
      });
    }

    console.error('Erro ao cadastrar usuário:', error);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar usuário.',
    });
  }
}

export async function login(req: Request, res: Response) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: 'E-mail ou senha inválidos.',
    });
  }

  const email = validation.data.email.toLowerCase();

  try {
    const [rows] = await database.execute<UserRow[]>(
      `SELECT id, name, email, password_hash, role, created_at, updated_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    const user = rows[0];

    if (
      !user ||
      !(await bcrypt.compare(validation.data.password, user.password_hash))
    ) {
      return res.status(401).json({
        message: 'E-mail ou senha inválidos.',
      });
    }

    const token = jwt.sign(
      {
        sub: String(user.id),
        role: user.role,
      },
      getJwtSecret(),
      {
        expiresIn: getJwtExpiresIn(),
      },
    );

    return res.status(200).json({
      message: 'Login realizado com sucesso.',
      data: {
        user: toUser(user),
        token,
      },
    });
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);

    return res.status(500).json({
      message: 'Erro interno ao realizar login.',
    });
  }
}

export async function me(_req: Request, res: Response) {
  const authenticatedUser = res.locals.authUser as { id: number };

  try {
    const [rows] = await database.execute<UserRow[]>(
      `SELECT id, name, email, password_hash, role, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [authenticatedUser.id],
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
      });
    }

    return res.status(200).json({
      message: 'Usuário autenticado recuperado com sucesso.',
      data: {
        user: toUser(user),
      },
    });
  } catch (error) {
    console.error('Erro ao recuperar usuário autenticado:', error);

    return res.status(500).json({
      message: 'Erro interno ao recuperar usuário.',
    });
  }
}

export async function registerTeacher(req: Request, res: Response) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const name = validation.data.name;
  const email = validation.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(validation.data.password, 12);

  try {
    const [result] = await database.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'teacher')`,
      [name, email, passwordHash],
    );

    const [rows] = await database.execute<UserRow[]>(
      `SELECT id, name, email, password_hash, role, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [result.insertId],
    );

    const user = rows[0];

    if (!user) {
      return res.status(500).json({
        message: 'Não foi possível recuperar o professor cadastrado.',
      });
    }

    return res.status(201).json({
      message: 'Professor cadastrado com sucesso.',
      data: {
        user: toUser(user),
      },
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ER_DUP_ENTRY'
    ) {
      return res.status(409).json({
        message: 'Este e-mail já está cadastrado.',
      });
    }

    console.error('Erro ao cadastrar professor:', error);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar professor.',
    });
  }
}

