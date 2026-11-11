import { Router } from 'express';

import {
  createComment,
  deleteComment,
  getCommentById,
  listCommentsByPost,
  updateComment,
} from '../controllers/comment.controller.js';

import {
  authenticate,
  requireRole,
} from '../middlewares/auth.middleware.js';

const commentRoutes = Router();

commentRoutes.get(
  '/posts/:postId/comments',
  listCommentsByPost,
);

commentRoutes.get(
  '/comments/:id',
  getCommentById,
);

commentRoutes.post(
  '/posts/:postId/comments',
  authenticate,
  requireRole('teacher', 'student'),
  createComment,
);

commentRoutes.put(
  '/comments/:id',
  authenticate,
  requireRole('teacher', 'student'),
  updateComment,
);

commentRoutes.delete(
  '/comments/:id',
  authenticate,
  requireRole('teacher', 'student'),
  deleteComment,
);

export { commentRoutes };

