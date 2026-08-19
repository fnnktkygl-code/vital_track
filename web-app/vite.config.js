import { defineConfig } from 'vite';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function apiMiddlewarePlugin() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0];
        if (url === '/api/analyze-text' || url === '/api/searchFood') {
          let analyzeTextHandler, searchFoodHandler;
          try {
            analyzeTextHandler = require('../api/analyze-text.js');
            searchFoodHandler = require('../api/searchFood.js');
          } catch (err) {
            console.warn('[API DEV] Could not load local API handlers:', err.message);
          }
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
              if (url === '/api/analyze-text' && analyzeTextHandler) {
                await analyzeTextHandler(req, res);
              } else if (searchFoodHandler) {
                await searchFoodHandler(req, res);
              } else {
                res.status(404).json({ error: 'API handler not available in current environment' });
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

