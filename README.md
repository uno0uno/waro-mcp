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

## MCP config (OpenCode / Claude Desktop)

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
