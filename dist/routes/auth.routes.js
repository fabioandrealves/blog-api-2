import { Router } from 'express';
import { login, me, register, registerTeacher, } from '../controllers/auth.controller.js';
import { authenticate, requireRole, } from '../middleware/auth.middleware.js';
const authRoutes = Router();
authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.get('/me', authenticate, me);
authRoutes.post('/teachers', authenticate, requireRole('admin'), registerTeacher);
export default authRoutes;
