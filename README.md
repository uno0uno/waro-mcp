# waro-mcp

MCP server for Waro Colombia — replacement for `waro-cli` for LLMs/agents. Reuses Waro API endpoints (`api-warolabs`/`api-warocol.com`) and contracts (`contract.rs`).

## Install

```bash
npm install
npm run build
```

## Run (stdio)

```bash
node build/index.js
# or
npm start
```

## Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

## Run (HTTP — remote for LLMs, multitenant)

```bash
# Per-request: el cliente manda su waro_sk, no necesitas WARO_API_KEY en env
MCP_PORT=8090 MCP_PATH=/mcp node build/http.js
# health (sin auth)
curl http://127.0.0.1:8090/health
# MCP con tenant del cliente
curl -H "Authorization: Bearer waro_sk_TU_KEY" -H "Accept: application/json, text/event-stream" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  http://127.0.0.1:8090/mcp
# Fallback legacy single-tenant (si no mandas waro_sk, usa env)
WARO_API_KEY=waro_sk_xxx MCP_PORT=8090 node build/http.js
```

Docker (hostinger — sin MCP_AUTH_TOKEN requerido):

```bash
docker compose up -d --build
# nginx: deploy/nginx-mcp.conf -> mcp.warolabs.com -> 127.0.0.1:8090 (CloudFront + origin-guard)
# Opcional legacy: MCP_AUTH_TOKEN=secret solo si quieres auth extra además de waro_sk
```

## MCP config (OpenCode / Claude Desktop)

Stdio (local):

```json
{
  "mcpServers": {
    "waro-mcp": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/waro-mcp/build/index.js"],
      "env": { "WARO_API_KEY": "waro_sk_xxx", "WARO_API_URL": "https://api.warolabs.com" }
    }
  }
}
```

Remote (HTTP — multitenant, el cliente usa su propia waro_sk):

```json
{
  "mcpServers": {
    "waro-mcp": {
      "type": "http",
      "url": "https://mcp.warolabs.com/mcp",
      "headers": { "Authorization": "Bearer waro_sk_TU_KEY" }
    }
  }
}
```

Legacy (MCP_AUTH_TOKEN solo si el servidor lo exige, no es el waro_sk):
`Authorization: Bearer $MCP_AUTH_TOKEN` — deprecated, usa `waro_sk`.

Default `WARO_API_URL` is `https://api.warolabs.com` — override via `WARO_API_URL` env or profile `api_url` in `~/.waro/config.toml`. Supports `WARO_PROFILE` (same as `waro-cli/src/config.rs:28`).

## Tools (26)

`waro_ping`, `waro_schema`, `sales_list|metrics|detail`, `customers_list|detail|orders|metrics`, `menu_products|recipes|modifiers`, `analytics_menu|food_cost|alerts|data_quality|cohort|waros|rfm|churn_risk`, `financial_products`, `waros_estimate|balances|customer`, `queries_schema|run`

All tools return `waro.agent.v1` envelope; errors set `isError:true`.

## Publish

```bash
npm publish --access public
```

## Roadmap

- Batch 1: scaffold + stdio
- Batch 2: tools/list contracts
- Batch 3: tools/call + auth + agent-json (this)
