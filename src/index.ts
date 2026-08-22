#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CONTRACTS } from "./contracts.js";
import { validateDate, validateEnum, validateFields, validateUuid } from "./validate.js";

const server = new McpServer({ name: "waro-mcp", version: "0.1.0" });

server.registerTool("waro_ping", { description: "Health check — returns ok.", inputSchema: z.object({}) }, async () => ({
  content: [{ type: "text" as const, text: JSON.stringify({ ok: true, message: "waro-mcp alive — 24 tools available" }) }],
}));

// Helper to build placeholder response for Batch 2 (no fetch yet)
function placeholder(contract: (typeof CONTRACTS)[number]) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ schema_version: "waro.agent.v1", ok: true, command: contract.command, method: contract.method, path: contract.path, scope: contract.scope, note: "Batch 2 placeholder — fetch wired in Batch 3", contract }, null, 2) }],
  };
}

// sales
server.registerTool("sales_list", { description: CONTRACTS[0].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50).describe("Max results 1-250"), offset: z.number().min(0).default(0), all: z.boolean().optional().describe("Fetch all pages NDJSON"), payment_method: z.enum(["cash","card","digital"]).optional(), status: z.enum(["completed","cancelled","pending"]).optional(), date_from: z.string().optional().describe("YYYY-MM-DD"), date_to: z.string().optional(), timezone: z.string().default("America/Bogota"), sort_field: z.enum(["order_date","order_number","total_amount","customer_name","payment_method"]).default("order_date"), sort_direction: z.enum(["asc","desc"]).default("desc"), fields: z.string().optional().describe("Comma-separated response fields"), dry_run: z.boolean().optional() }) }, async (a) => {
  if (a.date_from) validateDate("date-from", a.date_from); if (a.date_to) validateDate("date-to", a.date_to);
  if (a.status) validateEnum("status", a.status, ["completed","cancelled","pending"]);
  if (a.fields) validateFields(CONTRACTS[0].fields, a.fields);
  return placeholder(CONTRACTS[0]);
});
server.registerTool("sales_metrics", { description: CONTRACTS[1].description, inputSchema: z.object({ date_from: z.string().optional().describe("YYYY-MM-DD"), date_to: z.string().optional(), group_by: z.enum(["date","weekday","hour","product","payment","ticket"]).optional(), timezone: z.string().default("America/Bogota"), limit: z.number().min(1).max(100).default(20), sort_by: z.enum(["quantity","revenue"]).default("quantity"), ranges: z.string().optional(), compare_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => {
  if (a.date_from) validateDate("date-from", a.date_from); return placeholder(CONTRACTS[1]);
});
server.registerTool("sales_detail", { description: CONTRACTS[2].description, inputSchema: z.object({ order_id: z.string().describe("Order UUID"), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => {
  validateUuid("order-id", a.order_id); return placeholder(CONTRACTS[2]);
});

// customers
server.registerTool("customers_list", { description: CONTRACTS[3].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), all: z.boolean().optional(), date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => placeholder(CONTRACTS[3]));
server.registerTool("customers_detail", { description: CONTRACTS[4].description, inputSchema: z.object({ customer_id: z.string().describe("Customer UUID"), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => { validateUuid("customer-id", a.customer_id); return placeholder(CONTRACTS[4]); });
server.registerTool("customers_orders", { description: CONTRACTS[5].description, inputSchema: z.object({ customer_id: z.string(), limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => placeholder(CONTRACTS[5]));
server.registerTool("customers_metrics", { description: CONTRACTS[6].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => placeholder(CONTRACTS[6]));

// menu
server.registerTool("menu_products", { description: CONTRACTS[7].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => placeholder(CONTRACTS[7]));
server.registerTool("menu_recipes", { description: CONTRACTS[8].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[8]));
server.registerTool("menu_modifiers", { description: CONTRACTS[9].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[9]));

// analytics (7)
server.registerTool("analytics_menu", { description: CONTRACTS[10].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[10]));
server.registerTool("analytics_food_cost", { description: CONTRACTS[11].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[11]));
server.registerTool("analytics_alerts", { description: CONTRACTS[12].description, inputSchema: z.object({ fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[12]));
server.registerTool("analytics_data_quality", { description: CONTRACTS[13].description, inputSchema: z.object({ fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[13]));
server.registerTool("analytics_cohort", { description: CONTRACTS[14].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), period: z.enum(["week","month"]).optional() }) }, async (a) => placeholder(CONTRACTS[14]));
server.registerTool("analytics_waros", { description: CONTRACTS[15].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), group_by: z.enum(["day","week","customer"]).optional() }) }, async (a) => placeholder(CONTRACTS[15]));
server.registerTool("analytics_rfm", { description: CONTRACTS[16].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[16]));
server.registerTool("analytics_churn_risk", { description: CONTRACTS[17].description, inputSchema: z.object({ limit: z.number().min(1).max(100).default(20), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[17]));

// financial / waros / queries
server.registerTool("financial_products", { description: CONTRACTS[18].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[18]));
server.registerTool("waros_estimate", { description: CONTRACTS[19].description, inputSchema: z.object({ total: z.number().describe("Purchase total"), customer_id: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[19]));
server.registerTool("waros_balances", { description: CONTRACTS[20].description, inputSchema: z.object({ profile_ids: z.array(z.string()).describe("Profile IDs"), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[20]));
server.registerTool("waros_customer", { description: CONTRACTS[21].description, inputSchema: z.object({ profile_id: z.string(), fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[21]));
server.registerTool("queries_schema", { description: CONTRACTS[22].description, inputSchema: z.object({ fields: z.string().optional() }) }, async (a) => placeholder(CONTRACTS[22]));
server.registerTool("queries_run", { description: CONTRACTS[23].description, inputSchema: z.object({ spec: z.string().describe("JSON QuerySpec string"), fields: z.string().optional() }) }, async (a) => { JSON.parse(a.spec); return placeholder(CONTRACTS[23]); });

// schema introspection
server.registerTool("waro_schema", { description: "Introspect Waro API contracts — list all tools/contracts or detail one.", inputSchema: z.object({ command: z.string().optional().describe("e.g. sales list") }) }, async (a) => {
  if (a.command) { const c = CONTRACTS.find((x) => x.command === a.command); if (!c) throw new Error(`unknown command ${a.command}`); return { content: [{ type: "text" as const, text: JSON.stringify(c, null, 2) }] }; }
  return { content: [{ type: "text" as const, text: JSON.stringify(CONTRACTS.map((c) => ({ command: c.command, path: c.path, scope: c.scope, description: c.description })), null, 2) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("waro-mcp running on stdio — Batch 2: 25 tools");
}

main().catch((error) => {
  console.error("Fatal error in waro-mcp:", error);
  process.exit(1);
});
