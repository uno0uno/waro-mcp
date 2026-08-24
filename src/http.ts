#!/usr/bin/env node
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createWaroServer } from "./server.js";

const PORT = Number(process.env.MCP_PORT ?? process.env.PORT ?? 8090);
const HOST = process.env.MCP_HOST ?? "0.0.0.0";
const MCP_PATH = process.env.MCP_PATH ?? "/mcp";
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN?.trim();

function isAuthorized(req: http.IncomingMessage): boolean {
  if (!AUTH_TOKEN) return true;
  const hdr = req.headers.authorization ?? "";
  return hdr === `Bearer ${AUTH_TOKEN}`;
}

async function handler(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, mcp_path: MCP_PATH }));
    return;
  }
  if (url.pathname !== MCP_PATH) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found", mcp_path: MCP_PATH }));
    return;
  }
  if (!isAuthorized(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  const server = createWaroServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  res.on("close", () => transport.close());

  let body: unknown = undefined;
  if (req.method === "POST") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf-8");
    if (raw) {
      try { body = JSON.parse(raw); } catch { body = undefined; }
    }
  }

  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

const server = http.createServer(handler);

server.listen(PORT, HOST, () => {
  console.error(`waro-mcp http on http://${HOST}:${PORT}${MCP_PATH} (health /health) — stateless`);
});

function shutdown() {
  console.error("shutting down waro-mcp http");
  server.close(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
