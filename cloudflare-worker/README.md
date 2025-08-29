Cloudflare Worker (API)

Endpoints
- POST `/api/chat`: Forwards to Wisdom Gate `/v1/chat/completions` with your API key (from `Authorization: Bearer ...` or `X-API-Key`).
- GET `/health`: Health check.

Deploy
1) Edit `wrangler.toml`:
   - 已设置 `name = "highest"`，`account_id` 已写入。
   - 当前使用 workers.dev 部署：访问地址示例
     https://highest.huinkling-3bc.workers.dev/
   - 若需绑定自有域名再添加 `routes`（示例见注释）。
   - 可选：`[vars]` 中将 `MOCK_AI = "1"` 做本地/预览回显测试。
2) Install Wrangler if needed: `npm i -g wrangler`
3) From this directory, run:
   - `wrangler dev` (local dev)
   - `wrangler deploy`

Notes
- This Worker mirrors the Node server logic under `server/` for consistent responses and CORS headers.
- When hosting the static site (e.g., Cloudflare Pages), route `/api/*` to this Worker.
 - 或者仅用 Worker 同时托管静态（需在 wrangler.toml 添加 [assets] 并在 worker.js 中 fallback 到 ASSETS）。
