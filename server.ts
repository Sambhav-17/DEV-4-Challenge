import app from './api/index.js';
import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response } from 'express';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AFTERLIGHT Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Only start the local server in non-serverless environments
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start AFTERLIGHT server:', err);
  });
}

export default app;
