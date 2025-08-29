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
2) 已配置静态资源托管：`[assets] directory = "../public"`，同一个 Worker 会同时服务前端与 `/api`。
3) 本地调试/部署（任选其一）：
   - 安装 Wrangler: `npm i -g wrangler`
   - 在 `cloudflare-worker/` 目录下：
     - 开发调试：`wrangler dev`
     - 正式部署：`wrangler deploy`

Notes
- This Worker mirrors the Node server logic under `server/` for consistent responses and CORS headers.
- 当前配置为“单 Worker 托管前端 + API”，访问根路径即可打开前端，前端使用相对路径 `/api/chat` 调用后端。
- 如要改用 Pages 托管前端，也可移除此 `[assets]`，并在 Pages 侧路由 `/api/*` 到本 Worker。
