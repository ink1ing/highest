// Minimal tests without external dependencies
import assert from 'node:assert';
import { handleChat } from '../server/index.js';

function makeReq({ headers = {}, bodyObj = {} } = {}) {
  const listeners = {};
  const req = {
    headers,
    method: 'POST',
    on: (ev, cb) => { listeners[ev] = cb; }
  };
  // Simulate streaming body events
  queueMicrotask(() => {
    if (listeners['data']) listeners['data'](Buffer.from(JSON.stringify(bodyObj)));
    if (listeners['end']) listeners['end']();
  });
  return req;
}

function makeRes() {
  const res = { status: 0, headers: {}, body: Buffer.alloc(0) };
  return {
    writeHead(code, headers) { res.status = code; res.headers = headers || {}; },
    end(buf) { res.body = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf || '')); this._done = true; },
    _get() { return res; }
  };
}

(async () => {
  process.env.MOCK_AI = '1';

  // Missing API key
  {
    const req = makeReq({ headers: { 'content-type': 'application/json' }, bodyObj: { model: 'wisdom-ai-gpt5', messages: [{ role: 'user', content: 'hi' }] } });
    const res = makeRes();
    await handleChat(req, res);
    const out = res._get();
    assert.equal(out.status, 400);
    const json = JSON.parse(out.body.toString('utf8'));
    assert.ok(json.error);
  }

  // Invalid model
  {
    const req = makeReq({ headers: { 'authorization': 'Bearer test', 'content-type': 'application/json' }, bodyObj: { model: 'not-a-model', messages: [{ role: 'user', content: 'hi' }] } });
    const res = makeRes();
    await handleChat(req, res);
    const out = res._get();
    assert.equal(out.status, 400);
  }

  // Label mapping from UI.md
  {
    const req = makeReq({ headers: { 'authorization': 'Bearer test', 'content-type': 'application/json' }, bodyObj: { model: 'wisdom-ai-dsr1 (via DeepseekR1)', messages: [{ role: 'user', content: 'ping' }] } });
    const res = makeRes();
    await handleChat(req, res);
    const out = res._get();
    assert.equal(out.status, 200);
    const json = JSON.parse(out.body.toString('utf8'));
    assert.ok(json.choices?.[0]?.message?.content.includes('Echo'));
  }

  // Canonical code works
  {
    const req = makeReq({ headers: { 'authorization': 'Bearer test', 'content-type': 'application/json' }, bodyObj: { model: 'wisdom-ai-gpt5', messages: [{ role: 'user', content: 'hello' }] } });
    const res = makeRes();
    await handleChat(req, res);
    const out = res._get();
    assert.equal(out.status, 200);
  }

  console.log('All tests passed');
})().catch((e) => { console.error(e); process.exit(1); });
