import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { resolveModel, MODEL_CODES } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const HOST = process.env.HOST || '0.0.0.0';
const VENDOR_BASE = 'https://wisdom-gate.juheapi.com/v1';

function json(res, code, data, headers = {}) {
  const body = Buffer.from(JSON.stringify(data));
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(body.length),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    ...headers
  });
  res.end(body);
}

function notFound(res) {
  json(res, 404, { error: { message: 'Not found' } });
}

function getAuthKey(req) {
  const auth = req.headers['authorization'] || '';
  const xKey = req.headers['x-api-key'];
  if (typeof xKey === 'string' && xKey.trim()) return xKey.trim();
  if (typeof auth === 'string') {
    const m = auth.match(/^Bearer\s+(.+)/i);
    if (m) return m[1].trim();
    // Fallback if client sent raw key per example in CLAUDE.md
    if (auth && !auth.includes(' ')) return auth.trim();
  }
  return null;
}

async function parseBody(req, maxBytes = 262144) { // ~256KB cap
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > maxBytes) {
        try { req.destroy(); } catch {}
        const e = new Error('BODY_TOO_LARGE');
        e.code = 'BODY_TOO_LARGE';
        return reject(e);
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        const data = raw ? JSON.parse(raw) : {};
        resolve({ raw, data });
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function isMessageArray(val) {
  return Array.isArray(val) && val.every(m => m && typeof m.role === 'string' && typeof m.content === 'string');
}

export async function handleChat(req, res) {
  try {
    if (process.env.DEBUG) console.log('Chat request received');
    const key = getAuthKey(req);
    if (process.env.DEBUG) console.log('API key extracted:', key ? `${key.substring(0, 10)}...` : 'null');
    if (!key) return json(res, 400, { error: { message: 'Missing API key. Provide in Authorization: Bearer <key> or X-API-Key.' } });

    const { data } = await parseBody(req).catch((e) => {
      if (e && e.code === 'BODY_TOO_LARGE') {
        json(res, 413, { error: { message: 'Request body too large' } });
      } else {
        json(res, 400, { error: { message: 'Invalid JSON body' } });
      }
      throw e; // ensure outer catch stops further handling
    });
    const candidateModel = data.model;
    const model = resolveModel(candidateModel);
    if (!model) return json(res, 400, { error: { message: `Invalid model. Allowed: ${MODEL_CODES.join(', ')}` } });
    const messages = data.messages;
    if (!isMessageArray(messages)) return json(res, 400, { error: { message: 'Invalid messages. Expected array of { role, content }.' } });
    const max_tokens = data.max_tokens;

    // Mock mode for tests/offline
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (process.env.MOCK_AI === '1' || process.env.MOCK_AI === 'true') {
      return json(res, 200, {
        id: 'mock-chatcmpl-1',
        object: 'chat.completion',
        model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: `Echo (${model}): ${lastUser?.content ?? ''}` },
            finish_reason: 'stop'
          }
        ]
      });
    }

    const requestBody = JSON.stringify({ model, messages, ...(Number.isInteger(max_tokens) ? { max_tokens } : {}) });
    
    // Try to use a working Python subprocess if Node.js fetch continues to fail
    if (process.env.USE_PYTHON_REQUESTS === '1' || process.env.USE_PYTHON_REQUESTS === 'true') {
      const { spawn } = await import('node:child_process');
      
      const pythonScript = `
import requests
import json
import sys

try:
    response = requests.post(
        "${VENDOR_BASE}/chat/completions",
        headers={
            "Authorization": "Bearer ${key}",
            "Content-Type": "application/json"
        },
        json=${requestBody}
    )
    print(json.dumps({
        "status": response.status_code,
        "headers": dict(response.headers),
        "body": response.text
    }))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

      const pythonProcess = spawn('python3', ['-c', pythonScript]);
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      const pythonResult = await new Promise((resolve) => {
        pythonProcess.on('close', (code) => {
          resolve({ code, stdout, stderr });
        });
      });
      
      if (pythonResult.code === 0 && pythonResult.stdout) {
        try {
          const result = JSON.parse(pythonResult.stdout);
          if (result.error) {
            return json(res, 500, { error: { message: 'Python request failed', detail: result.error } });
          }
          
          const payload = JSON.parse(result.body);
          if (result.status !== 200) {
            return json(res, result.status, payload || { error: { message: 'Upstream error' } });
          }
          
          return json(res, 200, payload);
        } catch (e) {
          return json(res, 500, { error: { message: 'Failed to parse Python response', detail: pythonResult.stdout } });
        }
      }
    }

    // Default to using fetch with timeout
    const ctrl = new AbortController();
    const timeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS || 20000);
    const t = setTimeout(() => { try { ctrl.abort(); } catch {} }, timeoutMs);
    try {
      const vendorRes = await fetch(`${VENDOR_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'User-Agent': 'python-requests/2.31.0',
          'Accept-Encoding': 'gzip, deflate',
          'Accept': '*/*',
          'Connection': 'keep-alive',
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody, 'utf8').toString()
        },
        body: requestBody,
        signal: ctrl.signal
      });
      const raw = await vendorRes.text().catch(() => '');
      let payload = {};
      try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { error: { message: raw || 'Upstream error' } }; }
      if (!vendorRes.ok) {
        return json(res, vendorRes.status, payload || { error: { message: 'Upstream error' } });
      }
      return json(res, 200, payload);
    } catch (e) {
      if (e && (e.name === 'AbortError' || String(e).includes('AbortError'))) {
        return json(res, 504, { error: { message: 'Upstream timeout' } });
      }
      return json(res, 502, { error: { message: 'Upstream network error', detail: String(e && e.message || e) } });
    } finally {
      clearTimeout(t);
    }
  } catch (err) {
    return json(res, 500, { error: { message: 'Server error', detail: String(err && err.message || err) } });
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = url.pathname === '/' ? 'index.html' : url.pathname.substring(1);
  // prevent path traversal
  if (filePath.includes('..')) return notFound(res);
  const abs = join(__dirname, '..', 'public', filePath);
  try {
    const st = await stat(abs);
    if (!st.isFile()) return notFound(res);
    const data = await readFile(abs);
    const type = MIME[extname(abs)] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': String(data.length),
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  } catch {
    notFound(res);
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      });
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { status: 'ok' });
    }
    if (req.method === 'POST' && url.pathname === '/api/chat') {
      return handleChat(req, res);
    }
    if (req.method === 'GET') {
      return serveStatic(req, res);
    }
    return notFound(res);
  });
}

// Only auto-start when executed directly via `node server/index.js`
const isDirectRun = (() => {
  try {
    const entry = process.argv[1] ? new URL(`file://${process.argv[1]}`).href : '';
    return entry === import.meta.url;
  } catch { return false; }
})();

if (isDirectRun) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    // Do not log API keys anywhere
    const displayHost = (HOST === '0.0.0.0' || HOST === '::') ? 'localhost' : HOST;
    console.log(`Open http://${displayHost}:${PORT} in your browser.`);
  });
}
