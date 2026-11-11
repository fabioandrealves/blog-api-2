import { Router } from 'express';

import {
  createPost,
  deletePost,
  getPostById,
  listMyPosts,
  listPosts,
  updatePost,
} from '../controllers/post.controller.js';

import {
  authenticate,
  requireRole,
} from '../middlewares/auth.middleware.js';

const postRoutes = Router();

postRoutes.get('/', listPosts);

postRoutes.get(
  '/me',
  authenticate,
  requireRole('teacher'),
  listMyPosts,
);

postRoutes.get('/:id', getPostById);

postRoutes.post(
  '/',
  authenticate,
  requireRole('teacher'),
  createPost,
);

postRoutes.put(
  '/:id',
  authenticate,
  requireRole('teacher'),
  updatePost,
);

postRoutes.delete(
  '/:id',
  authenticate,
  requireRole('teacher'),
  deletePost,
);

export { postRoutes };
