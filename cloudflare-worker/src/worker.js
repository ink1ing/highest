// Cloudflare Worker for Highest: mirrors the Node server /api/chat behavior
// - POST /api/chat: forwards to Wisdom Gate API /v1/chat/completions
// - GET /health: simple health check

const VENDOR_BASE = 'https://wisdom-gate.juheapi.com/v1';

function jsonResponse(code, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  return new Response(body, {
    status: code,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      ...extraHeaders,
    },
  });
}

function ok() { return jsonResponse(200, { status: 'ok' }); }
function notFound() { return jsonResponse(404, { error: { message: 'Not found' } }); }

function getAuthKey(req) {
  const auth = req.headers.get('authorization') || '';
  const xKey = req.headers.get('x-api-key');
  if (xKey && xKey.trim()) return xKey.trim();
  if (auth) {
    const m = auth.match(/^Bearer\s+(.+)/i);
    if (m) return m[1].trim();
    if (!auth.includes(' ')) return auth.trim();
  }
  return null;
}

const MODEL_CODES = [
  'wisdom-ai-gpt5',
  'wisdom-ai-gpt5-mini',
  'wisdom-ai-gpt5-nano',
  'wisdom-ai-dsv3',
  'wisdom-ai-dsr1',
  'wisdom-ai-claude-sonnet-4',
  'wisdom-ai-gemini-2.5-flash',
];
const MODEL_LABEL_TO_CODE = {
  'wisdom-ai-gpt5 (via Gpt5)': 'wisdom-ai-gpt5',
  'wisdom-ai-gpt5-mini (via Gpt5 Mini)': 'wisdom-ai-gpt5-mini',
  'wisdom-ai-gpt5-nano (via Gpt5 Nano)': 'wisdom-ai-gpt5-nano',
  'wisdom-ai-dsv3 (via DeepseekV3)': 'wisdom-ai-dsv3',
  'wisdom-ai-dsr1 (via DeepseekR1)': 'wisdom-ai-dsr1',
  'wisdom-ai-claude-sonnet-4 (via Claude Sonnet 4)': 'wisdom-ai-claude-sonnet-4',
  'wisdom-ai-gemini-2.5-flash (via Gemini 2.5 Flash)': 'wisdom-ai-gemini-2.5-flash',
};
function resolveModel(input) {
  if (!input || typeof input !== 'string') return null;
  if (MODEL_LABEL_TO_CODE[input]) return MODEL_LABEL_TO_CODE[input];
  const stripped = input.replace(/\s*\(via [^)]+\)\s*$/, '');
  if (MODEL_CODES.includes(stripped)) return stripped;
  if (MODEL_CODES.includes(input)) return input;
  return null;
}

async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

export default {
  async fetch(req, env) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        },
      });
    }

    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/health') return ok();
    if (req.method === 'POST' && url.pathname === '/api/chat') {
      const key = getAuthKey(req);
      if (!key) return jsonResponse(400, { error: { message: 'Missing API key. Provide in Authorization: Bearer <key> or X-API-Key.' } });

      const data = await readJson(req);
      const model = resolveModel(data?.model);
      if (!model) return jsonResponse(400, { error: { message: `Invalid model. Allowed: ${MODEL_CODES.join(', ')}` } });
      const messages = Array.isArray(data?.messages) ? data.messages : null;
      if (!Array.isArray(messages) || !messages.every(m => m && typeof m.role === 'string' && typeof m.content === 'string')) {
        return jsonResponse(400, { error: { message: 'Invalid messages. Expected array of { role, content }.' } });
      }
      const max_tokens = data && Number.isInteger(data.max_tokens) ? data.max_tokens : undefined;

      // Mock mode via environment variable
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      if (env && (env.MOCK_AI === '1' || env.MOCK_AI === 'true')) {
        return jsonResponse(200, {
          id: 'mock-chatcmpl-1',
          object: 'chat.completion',
          model,
          choices: [
            { index: 0, message: { role: 'assistant', content: `Echo (${model}): ${lastUser?.content ?? ''}` }, finish_reason: 'stop' },
          ],
        });
      }

      const body = JSON.stringify({ model, messages, ...(max_tokens !== undefined ? { max_tokens } : {}) });
      const upstream = await fetch(`${VENDOR_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body,
      });
      const text = await upstream.text();
      let payload = null; try { payload = JSON.parse(text); } catch { payload = null; }
      const status = upstream.status;
      if (!upstream.ok) {
        return jsonResponse(status, payload || { error: { message: text || 'Upstream error' } });
      }
      return jsonResponse(200, payload || {});
    }
    return notFound();
  },
};

