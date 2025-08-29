# Wisdom Gate AI Backend Integration

A minimal backend proxy and simple test UI to integrate multiple AI models via Wisdom Gate API.

Built strictly from the Markdown specs provided:
- API: `CLAUDE.md` (Wisdom Gate API base URL, auth, models, POST /chat/completions)
- Frontend: `UI.md` (model label list, API key entry, send UX)

## Quick Start

- Prerequisite: Node.js 18+
- Start locally: `npm run dev`
  - Opens the backend at `http://localhost:8787`
  - Serves a simple UI at `/`

## How It Works

- Frontend collects: API Key (entered by user) + model selection + message
- Backend endpoint: `POST /api/chat`
  - Validates payload and maps UI model labels to canonical codes
  - Calls Wisdom Gate `POST /v1/chat/completions`
  - Returns the JSON response (non-stream)

## API Details (from CLAUDE.md)

- Base URL: `https://wisdom-gate.juheapi.com/v1`
- Auth header: `Authorization: Bearer YOUR_API_KEY`
- Endpoint: `POST /chat/completions`
  - body: `{ model: string, messages: Array<{role, content}>, max_tokens?: number }`
- Models:
  - `wisdom-ai-gpt5`
  - `wisdom-ai-gpt5-mini`
  - `wisdom-ai-gpt5-nano`
  - `wisdom-ai-dsv3`
  - `wisdom-ai-dsr1`
  - `wisdom-ai-claude-sonnet-4`
  - `wisdom-ai-gemini-2.5-flash`

## Backend Routes

- `GET /health`: Health check
- `POST /api/chat`: Proxy to Wisdom Gate
  - Headers (one of):
    - `Authorization: Bearer <YOUR_API_KEY>`
    - `X-API-Key: <YOUR_API_KEY>`
  - Body:
    - `model`: Accepts either canonical code or UI label (e.g. `"wisdom-ai-dsr1 (via DeepseekR1)"`)
    - `messages`: Array of `{ role: 'user' | 'assistant', content: string }`
    - `max_tokens?`: optional number

Example request:

```
curl -X POST http://localhost:8787/api/chat \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "wisdom-ai-dsv3 (via DeepseekV3)",
    "messages": [{"role":"user","content":"Hello"}]
  }'
```

## Security Notes

- Do not log API keys. The backend never prints the key.
- Keys are supplied by the end user in the frontend, then forwarded to the backend over HTTPS (recommend using HTTPS in production).

## Frontend Integration

Your existing frontend can call the backend as follows:

```ts
await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + userProvidedKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: uiSelectedModelLabelOrCode,
    messages: chatMessages
  })
});
```

Notes:
- You may send either the UI label from `UI.md` or the canonical model code from `CLAUDE.md`; backend maps labels to codes.
- Keep the API key outside of application logs and analytics.

## Test Cases

- Health check
  - Request: `GET /health`
  - Expect: `200 {"status":"ok"}`

- Missing API key
  - Request: `POST /api/chat` with no `Authorization`/`X-API-Key`
  - Expect: `400` and error message about missing key

- Invalid model
  - Request: `POST /api/chat` with `model: "not-a-model"`
  - Expect: `400` and list of allowed models

- Label mapping
  - Request: `POST /api/chat` with `model: "wisdom-ai-dsr1 (via DeepseekR1)"`
  - Expect: `200` and a valid completion JSON

- Canonical model code
  - Request: `POST /api/chat` with `model: "wisdom-ai-gpt5"`
  - Expect: `200` and a valid completion JSON

Run tests (offline, mocked): `npm test`

## Project Structure

- `server/index.js`: HTTP server, routes, proxy logic
- `server/models.js`: Model codes and label-to-code resolver
- `public/index.html`: Minimal test UI (API key + model + chat)
- `scripts/test.js`: No-deps tests using Node core modules
- `CLAUDE.md`, `UI.md`: The provided specs

## Operations

- Local development: `npm run dev`
- Production: use a process manager (e.g., `pm2`) to run `node server/index.js`
- Environment variables:
  - `PORT`: default `8787`
  - `HOST`: default `0.0.0.0`
  - `MOCK_AI`: `1` to mock completions (used by tests/offline)

### Troubleshooting

- HTTP ERROR 502 at 0.0.0.0
  - 0.0.0.0 is a bind address, not a browsable host. Open `http://localhost:8787` (or `http://127.0.0.1:8787`) instead.

## Limitations

- Streaming responses are not implemented; the endpoint returns full JSON once available.
- This is a demo-friendly proxy; in production, consider session-scoped tokens or server-stored keys for better security.

## Acknowledgements

- API spec and model list from `CLAUDE.md`
- UI model labels and API key UX from `UI.md`
