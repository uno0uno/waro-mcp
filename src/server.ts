import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CONTRACTS } from "./contracts.js";
import { validateDate, validateEnum, validateFields, validateUuid } from "./validate.js";
import { loadConfig, type WaroConfig } from "./config.js";
import { WaroClient } from "./client.js";
import { toAgentJson, toAgentError, errorKind } from "./output.js";

export function createWaroServer(getConfig?: () => WaroConfig): McpServer {
  const server = new McpServer({ name: "waro-mcp", version: "0.1.0" });

  function getClient(): WaroClient {
    const cfg = getConfig ? getConfig() : loadConfig();
    return new WaroClient(cfg);
  }

  async function callWithAgent(contract: (typeof CONTRACTS)[number], body: unknown, fields?: string) {
    const client = getClient();
    try {
      const data = contract.method === "GET" ? await client.get(contract.path) : await client.post(contract.path, body as Record<string, unknown>);
      const envelope = toAgentJson(contract, data, fields);
      return { content: [{ type: "text" as const, text: JSON.stringify(envelope, null, 2) }] };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const err = toAgentError(contract.command, msg, errorKind(msg));
      return { content: [{ type: "text" as const, text: JSON.stringify(err, null, 2) }], isError: true as const };
    }
  }

  server.registerTool("waro_ping", { description: "Health check — returns ok.", inputSchema: z.object({}) }, async () => ({
    content: [{ type: "text" as const, text: JSON.stringify({ ok: true, message: "waro-mcp alive — 26 tools available" }) }],
  }));

  server.registerTool("sales_list", { description: CONTRACTS[0].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50).describe("Max results 1-250"), offset: z.number().min(0).default(0), all: z.boolean().optional().describe("Fetch all pages NDJSON"), payment_method: z.enum(["cash","card","digital"]).optional(), status: z.enum(["completed","cancelled","pending"]).optional(), date_from: z.string().optional().describe("YYYY-MM-DD"), date_to: z.string().optional(), timezone: z.string().default("America/Bogota"), sort_field: z.enum(["order_date","order_number","total_amount","customer_name","payment_method"]).default("order_date"), sort_direction: z.enum(["asc","desc"]).default("desc"), fields: z.string().optional().describe("Comma-separated response fields"), dry_run: z.boolean().optional() }) }, async (a) => {
    if (a.date_from) validateDate("date-from", a.date_from); if (a.date_to) validateDate("date-to", a.date_to);
    if (a.status) validateEnum("status", a.status, ["completed","cancelled","pending"]);
    if (a.fields) validateFields(CONTRACTS[0].fields, a.fields);
    if (a.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, body: a }, null, 2) }] };
    return callWithAgent(CONTRACTS[0], { limit: a.limit, offset: a.offset, paymentMethod: a.payment_method, status: a.status, dateFrom: a.date_from, dateTo: a.date_to, timezone: a.timezone, sortField: a.sort_field, sortDirection: a.sort_direction }, a.fields);
  });
  server.registerTool("sales_metrics", { description: CONTRACTS[1].description, inputSchema: z.object({ date_from: z.string().optional().describe("YYYY-MM-DD"), date_to: z.string().optional(), group_by: z.enum(["date","weekday","hour","product","payment","ticket"]).optional(), timezone: z.string().default("America/Bogota"), limit: z.number().min(1).max(100).default(20), sort_by: z.enum(["quantity","revenue"]).default("quantity"), ranges: z.string().optional(), compare_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => {
    if (a.date_from) validateDate("date-from", a.date_from); if (a.date_to) validateDate("date-to", a.date_to);
    if (a.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, body: a }, null, 2) }] };
    return callWithAgent(CONTRACTS[1], { dateFrom: a.date_from, dateTo: a.date_to, groupBy: a.group_by, timezone: a.timezone, limit: a.limit, sortBy: a.sort_by, ranges: a.ranges, compareTo: a.compare_to }, a.fields);
  });
  server.registerTool("sales_detail", { description: CONTRACTS[2].description, inputSchema: z.object({ order_id: z.string().describe("Order UUID"), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => {
    validateUuid("order-id", a.order_id); if (a.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, body: a }, null, 2) }] };
    return callWithAgent(CONTRACTS[2], { orderId: a.order_id }, a.fields);
  });
  server.registerTool("customers_list", { description: CONTRACTS[3].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), all: z.boolean().optional(), date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => {
    if (a.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true, body: a }, null, 2) }] };
    return callWithAgent(CONTRACTS[3], { limit: a.limit, offset: a.offset, dateFrom: a.date_from, dateTo: a.date_to }, a.fields);
  });
  server.registerTool("customers_detail", { description: CONTRACTS[4].description, inputSchema: z.object({ customer_id: z.string().describe("Customer UUID"), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => {
    validateUuid("customer-id", a.customer_id); if (a.dry_run) return { content: [{ type: "text" as const, text: JSON.stringify({ dry_run: true }, null, 2) }] };
    return callWithAgent(CONTRACTS[4], { customerId: a.customer_id }, a.fields);
  });
  server.registerTool("customers_orders", { description: CONTRACTS[5].description, inputSchema: z.object({ customer_id: z.string(), limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => callWithAgent(CONTRACTS[5], { customerId: a.customer_id, limit: a.limit, offset: a.offset, dateFrom: a.date_from, dateTo: a.date_to }, a.fields));
  server.registerTool("customers_metrics", { description: CONTRACTS[6].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => callWithAgent(CONTRACTS[6], { dateFrom: a.date_from, dateTo: a.date_to }, a.fields));
  server.registerTool("menu_products", { description: CONTRACTS[7].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), fields: z.string().optional(), dry_run: z.boolean().optional() }) }, async (a) => callWithAgent(CONTRACTS[7], { limit: a.limit, offset: a.offset }, a.fields));
  server.registerTool("menu_recipes", { description: CONTRACTS[8].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[8], { limit: a.limit, offset: a.offset }, a.fields));
  server.registerTool("menu_modifiers", { description: CONTRACTS[9].description, inputSchema: z.object({ limit: z.number().min(1).max(250).default(50), offset: z.number().min(0).default(0), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[9], { limit: a.limit, offset: a.offset }, a.fields));
  server.registerTool("analytics_menu", { description: CONTRACTS[10].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[10], { dateFrom: a.date_from, dateTo: a.date_to }, a.fields));
  server.registerTool("analytics_food_cost", { description: CONTRACTS[11].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[11], { dateFrom: a.date_from, dateTo: a.date_to }, a.fields));
  server.registerTool("analytics_alerts", { description: CONTRACTS[12].description, inputSchema: z.object({ fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[12], {}, a.fields));
  server.registerTool("analytics_data_quality", { description: CONTRACTS[13].description, inputSchema: z.object({ fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[13], {}, a.fields));
  server.registerTool("analytics_cohort", { description: CONTRACTS[14].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), period: z.enum(["week","month"]).optional() }) }, async (a) => callWithAgent(CONTRACTS[14], { dateFrom: a.date_from, dateTo: a.date_to, period: a.period }));
  server.registerTool("analytics_waros", { description: CONTRACTS[15].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), group_by: z.enum(["day","week","customer"]).optional() }) }, async (a) => callWithAgent(CONTRACTS[15], { dateFrom: a.date_from, dateTo: a.date_to, groupBy: a.group_by }));
  server.registerTool("analytics_rfm", { description: CONTRACTS[16].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[16], { dateFrom: a.date_from, dateTo: a.date_to }, a.fields));
  server.registerTool("analytics_churn_risk", { description: CONTRACTS[17].description, inputSchema: z.object({ limit: z.number().min(1).max(100).default(20), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[17], { limit: a.limit }, a.fields));
  server.registerTool("financial_products", { description: CONTRACTS[18].description, inputSchema: z.object({ date_from: z.string().optional(), date_to: z.string().optional(), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[18], { dateFrom: a.date_from, dateTo: a.date_to }, a.fields));
  server.registerTool("waros_estimate", { description: CONTRACTS[19].description, inputSchema: z.object({ total: z.number().describe("Purchase total"), customer_id: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[19], { total: a.total, customerId: a.customer_id }));
  server.registerTool("waros_balances", { description: CONTRACTS[20].description, inputSchema: z.object({ profile_ids: z.array(z.string()).describe("Profile IDs"), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[20], { profileIds: a.profile_ids }, a.fields));
  server.registerTool("waros_customer", { description: CONTRACTS[21].description, inputSchema: z.object({ profile_id: z.string(), fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[21], { profileId: a.profile_id }, a.fields));
  server.registerTool("queries_schema", { description: CONTRACTS[22].description, inputSchema: z.object({ fields: z.string().optional() }) }, async (a) => callWithAgent(CONTRACTS[22], {}, a.fields));
  server.registerTool("queries_run", { description: CONTRACTS[23].description, inputSchema: z.object({ spec: z.string().describe("JSON QuerySpec string"), fields: z.string().optional() }) }, async (a) => { const spec = JSON.parse(a.spec); return callWithAgent(CONTRACTS[23], spec, a.fields); });
  server.registerTool("waro_schema", { description: "Introspect Waro API contracts — list all tools/contracts or detail one.", inputSchema: z.object({ command: z.string().optional().describe("e.g. sales list") }) }, async (a) => {
    if (a.command) { const c = CONTRACTS.find((x) => x.command === a.command); if (!c) throw new Error(`unknown command ${a.command}`); return { content: [{ type: "text" as const, text: JSON.stringify(c, null, 2) }] }; }
    return { content: [{ type: "text" as const, text: JSON.stringify(CONTRACTS.map((c) => ({ command: c.command, path: c.path, scope: c.scope, description: c.description })), null, 2) }] };
  });

  return server;
}
