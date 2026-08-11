import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './backend/src/app.js';

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const expressApp = await createApp();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`[ADMS QRIS INTERNAL] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[FATAL SERVER STARTUP ERROR]', err);
  process.exit(1);
});
