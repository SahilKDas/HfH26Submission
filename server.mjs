import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Render } from '@renderinc/sdk';

const root = fileURLToPath(new URL('./dist', import.meta.url));
const port = Number(process.env.PORT || 4173);
const workflowSlug = process.env.RENDER_AUDIT_TASK_SLUG || 'unspool-ai-audit/run_model_card_audit';
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function json(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw new Error('Payload too large');
  }
  return JSON.parse(body || '{}');
}

function serveAsset(pathname, response) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const safe = normalize(relative).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, safe);
  if (!existsSync(file) || !statSync(file).isFile()) file = join(root, 'index.html');
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
    'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(file).pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/healthz') return json(response, 200, { status: 'ok', privacyMode: 'local-first' });

  if (request.method === 'POST' && url.pathname === '/api/workflow/audit') {
    try {
      const input = await readJson(request);
      if (input.kind !== 'synthetic-parity-audit') return json(response, 400, { error: 'Only synthetic audit inputs are accepted.' });
      if (!process.env.RENDER_API_KEY) {
        return json(response, 200, {
          configured: false,
          status: 'local-safe-mode',
          message: 'The production Workflow is not connected in this local environment.',
        });
      }
      const render = new Render();
      const run = await render.workflows.startTask(workflowSlug, [{ cohortSize: 48, seed: 2026 }]);
      return json(response, 202, { configured: true, status: 'queued', taskRunId: run.taskRunId, task: workflowSlug });
    } catch (error) {
      return json(response, 400, { error: error instanceof Error ? error.message : 'Unable to start audit.' });
    }
  }

  if (request.method === 'GET') return serveAsset(url.pathname, response);
  return json(response, 405, { error: 'Method not allowed' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Unspool listening on ${port}`);
});
