import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

function apiProxyPlugin(): Plugin {
  return {
    name: 'partei-raten-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET' || !req.url) {
          next();
          return;
        }

        const incomingUrl = new URL(req.url, 'http://localhost');
        let targetUrl: URL | null = null;

        if (incomingUrl.pathname === '/api/abgeordnetenwatch/politicians') {
          targetUrl = new URL('https://www.abgeordnetenwatch.de/api/v2/politicians');
          targetUrl.search = incomingUrl.search;
        }

        if (incomingUrl.pathname === '/api/wikidata/entities') {
          targetUrl = new URL('https://www.wikidata.org/w/api.php');
          targetUrl.searchParams.set('action', 'wbgetentities');
          targetUrl.searchParams.set('ids', incomingUrl.searchParams.get('ids') || '');
          targetUrl.searchParams.set('props', 'claims');
          targetUrl.searchParams.set('format', 'json');
        }

        if (!targetUrl) {
          next();
          return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
          const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'User-Agent': 'Partei Raten/1.0 (local development)',
            },
          });

          const body = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
          res.setHeader('Cache-Control', 'public, max-age=300');
          res.end(body);
        } catch (error) {
          console.error('Local API proxy failed:', error);
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API request failed' }));
        } finally {
          clearTimeout(timeout);
        }
      });
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), apiProxyPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
