import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import chatHandler from './api/chat.js';

function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        let body = '';
        for await (const chunk of req) body += chunk;
        req.body = body;

        const apiRes = {
          setHeader(name, value) {
            res.setHeader(name, value);
          },
          status(code) {
            res.statusCode = code;
            return this;
          },
          json(payload) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
          },
        };

        await chatHandler(req, apiRes);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.MINIMAX_API_KEY ||= env.MINIMAX_API_KEY;
  process.env.MINIMAX_TOKEN_PLAN_API_KEY ||= env.MINIMAX_TOKEN_PLAN_API_KEY;
  process.env.MINIMAX_MODEL ||= env.MINIMAX_MODEL;
  process.env.OPENROUTER_API_KEY ||= env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_IMAGE_MODEL ||= env.OPENROUTER_IMAGE_MODEL;
  process.env.OPENROUTER_SITE_URL ||= env.OPENROUTER_SITE_URL;
  process.env.OPENROUTER_APP_NAME ||= env.OPENROUTER_APP_NAME;

  return {
    plugins: [react(), localApiPlugin()],
  };
});
