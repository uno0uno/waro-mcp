# Waro MCP — Agent Skill Guide

Replaces `waro-cli/SKILL.md` for MCP hosts.

## Setup (MCP host)

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

Or use `~/.waro/config.toml` profiles via `WARO_PROFILE`.

## Invariants

- All tools return `waro.agent.v1` envelope: `{ok, command, method, path, scope, rows, data, pagination}`
- Errors return `{ok:false, error:{message,kind}}` with `isError:true`
- Use `fields` param to reduce context (comma-separated, validated vs contract)
- `waro_schema` is source of truth for contracts: call `waro_schema` then `waro_schema {command:"sales list"}`
- Timezone default `America/Bogota`
- Never log `WARO_API_KEY` (client uses Bearer, never echoed)

## Tools (26)

- `waro_ping`, `waro_schema`, `sales_list|metrics|detail`, `customers_list|detail|orders|metrics`, `menu_products|recipes|modifiers`, `analytics_*` (7), `financial_products`, `waros_estimate|balances|customer`, `queries_schema|run`

## Examples (via MCP)

- sales list: `sales_list {limit:20, fields:"id,status,totalAmount"}`
- queries: `queries_run {spec:'{"dataset":"sales_items","measures":["revenue"],"dimensions":["product"],"limit":5}'}`
