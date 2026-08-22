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
npm run inspect
# or
npx @modelcontextprotocol/inspector node build/index.js
```

## MCP config

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

Supports `~/.waro/config.toml` profiles via `WARO_PROFILE` (ported from `waro-cli/src/config.rs` in Batch 3).

## Roadmap

- Batch 1: scaffold + stdio transport (this)
- Batch 2: `tools/list` from `contract.rs` (8 domains)
- Batch 3: `tools/call` + `agent-json` + publish
