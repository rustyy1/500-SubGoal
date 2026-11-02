import { createServer } from 'node:http';
import { getSubscriberData } from './youtube.mjs';

const PORT = Number(process.env.API_PORT || 8787);
let cached = null;
let cachedAt = 0;
const CACHE_MS = 60_000;

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
  if (requestUrl.pathname !== '/api/subscribers') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json', Allow: 'GET' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    if (!cached || Date.now() - cachedAt > CACHE_MS) {
      cached = await getSubscriberData(process.env);
      cachedAt = Date.now();
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': 'http://localhost:5173',
    });
    res.end(JSON.stringify(cached));
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      configured: Boolean(process.env.YOUTUBE_API_KEY || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)),
      error: error instanceof Error ? error.message : 'Unable to load YouTube subscriber data.',
    }));
  }
});

server.listen(PORT, () => {
  console.log(`Rustyy local API running at http://localhost:${PORT}`);
});
