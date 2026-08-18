import { defineConfig } from 'vite';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const analyzeTextHandler = require('../api/analyze-text.js');
const searchFoodHandler = require('../api/searchFood.js');

function apiMiddlewarePlugin() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0];
        if (url === '/api/analyze-text' || url === '/api/searchFood') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {};
            } catch (e) {
              req.body = {};
            }
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };
            try {
              if (url === '/api/analyze-text') {
                await analyzeTextHandler(req, res);
              } else {
                await searchFoodHandler(req, res);
              }
            } catch (e) {
              console.error(`[API DEV] Error handling ${url}:`, e);
              res.status(500).json({ error: e.message });
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  root: '.',
  plugins: [apiMiddlewarePlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

