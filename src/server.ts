
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import { postRoutes } from './routes/post.routes.js';
import { commentRoutes } from './routes/comment.routes.js';
import { userManagementRoutes } from './routes/user-management.routes.js';

const app = express();

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3333);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);

  res.on('finish', () => {
    console.log(`Status: ${res.statusCode}`);
  });

  next();
});

app.get('/', (_req, res) => {
  res.json({ message: 'Blog API funcionando!' });
});

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API disponível',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1', commentRoutes);
app.use('/api/v1', userManagementRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Rota não encontrada.',
  });
});

app.listen(port, host, () => {
  console.log(`Servidor rodando em http://${host}:${port}`);
});

