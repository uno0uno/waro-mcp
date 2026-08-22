#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "waro-mcp",
  version: "0.1.0",
});

// Placeholder tool — Batch 1 only verifies transport + tools/list
server.registerTool(
  "waro_ping",
  {
    description: "Health check — returns ok. Placeholder for Batch 1 scaffold.",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [{ type: "text" as const, text: JSON.stringify({ ok: true, message: "waro-mcp scaffold alive" }) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("waro-mcp running on stdio — Batch 1 scaffold");
}

main().catch((error) => {
  console.error("Fatal error in waro-mcp:", error);
  process.exit(1);
});
