Cloudflare Worker (API)

Endpoints
- POST `/api/chat`: Forwards to Wisdom Gate `/v1/chat/completions` with your API key (from `Authorization: Bearer ...` or `X-API-Key`).
- GET `/health`: Health check.

Deploy
1) Edit `wrangler.toml`:
   - Set `name`, `account_id`, and add `routes` for your domain/path.
   - Optionally set `MOCK_AI = "1"` under `[vars]` for testing.
2) Install Wrangler if needed: `npm i -g wrangler`
3) From this directory, run:
   - `wrangler dev` (local dev)
   - `wrangler deploy`

Notes
- This Worker mirrors the Node server logic under `server/` for consistent responses and CORS headers.
- When hosting the static site (e.g., Cloudflare Pages), route `/api/*` to this Worker.

