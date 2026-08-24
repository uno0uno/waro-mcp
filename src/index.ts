#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWaroServer } from "./server.js";

const server = createWaroServer();

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("waro-mcp running on stdio — 26 tools + auth + agent-json");
}

main().catch((error) => {
  console.error("Fatal error in waro-mcp:", error);
  process.exit(1);
});
