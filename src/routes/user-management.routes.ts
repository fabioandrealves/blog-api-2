import { Router } from 'express';

import {
  listTeachers,
  updateTeacher,
  deleteTeacher,
  listStudents,
  updateStudent,
  deleteStudent,
} from '../controllers/user-management.controller.js';

import {
  authenticate,
  requireRole,
} from '../middlewares/auth.middleware.js';

const userManagementRoutes = Router();

// Todas as operações exigem autenticação.
userManagementRoutes.use(authenticate);

// Gerenciamento de professores: somente admin.
userManagementRoutes.get(
  '/teachers',
  requireRole('admin'),
  listTeachers,
);

userManagementRoutes.put(
  '/teachers/:id',
  requireRole('admin'),
  updateTeacher,
);

userManagementRoutes.delete(
  '/teachers/:id',
  requireRole('admin'),
  deleteTeacher,
);

// Gerenciamento de estudantes: somente teacher.
userManagementRoutes.get(
  '/students',
  requireRole('teacher'),
  listStudents,
);

userManagementRoutes.put(
  '/students/:id',
  requireRole('teacher'),
  updateStudent,
);

userManagementRoutes.delete(
  '/students/:id',
  requireRole('teacher'),
  deleteStudent,
);

export { userManagementRoutes };