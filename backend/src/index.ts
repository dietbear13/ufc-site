// server/index.cjs
import { createServer } from 'http';
import express from 'express';
import { loadNuxt } from 'nuxt';

async function start() {
    const app = express();
    const isDev = process.env.NODE_ENV !== 'production';
    const nuxt = await loadNuxt(isDev ? 'dev' : 'start');

    // (Опционально) Пример API-маршрута:
    app.get('/api/ping', (_req, res) => res.json({ msg: 'pong' }));

    // Middleware Nuxt для SSR рендеринга
    app.use(nuxt.render);

    const port = process.env.PORT || 3000;
    createServer(app).listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}

start();
