import type { CommandContract } from "./contracts.js";

export function toAgentJson(contract: CommandContract, value: unknown, fields?: string) {
  const appliedFields = fields?.split(",").map((s) => s.trim()).filter(Boolean);
  const rows = rowsForContract(value, contract);
  const data = dataForContract(value, contract);
  const pagination = paginationForContract(value, contract);
  return {
    schema_version: "waro.agent.v1",
    ok: true,
    command: contract.command,
    method: contract.method,
    path: contract.path,
    scope: contract.scope,
    paginates: contract.paginates,
    row_path: contract.rowPath,
    rows,
    data,
    pagination,
    available_fields: contract.fields,
    applied_fields: appliedFields ?? null,
  };
}

export function toAgentError(command: string, message: string, kind: string) {
  return { schema_version: "waro.agent.v1", ok: false, command, error: { message, kind } };
}

export function errorKind(message: string): string {
  if (/WARO_API_KEY|config file|profile|HOME/.test(message)) return "config";
  if (/unknown field|not allowed|must be|required|Invalid|UUID|YYYY-MM-DD/.test(message)) return "validation";
  if (/HTTP|API|Cannot reach|Network|request|response|Resource not found|Insufficient scope|Rate limit|Server error/.test(message)) return "api";
  return "unknown";
}

function rowsForContract(value: unknown, contract: CommandContract): unknown[] {
  const v = value as Record<string, unknown>;
  switch (contract.shape) {
    case "data_rows": return (v["data"] as unknown[]) ?? [];
    case "data_object": { const d = v["data"] as Record<string, unknown>; return d ? [d] : []; }
    case "nested_rows": {
      let cur: unknown = v;
      for (const part of contract.rowPath.split(".")) cur = (cur as Record<string, unknown>)?.[part];
      return (cur as unknown[]) ?? [];
    }
    case "top_level_rows": return (v[contract.rowPath] as unknown[]) ?? [];
    case "top_level_object": return [v];
    case "balances_map": {
      const b = v["balances"] as Record<string, unknown>;
      if (!b) return [];
      return Object.entries(b).map(([k, val]) => ({ profile_id: k, balance: val }));
    }
    default: return [];
  }
}

function dataForContract(value: unknown, contract: CommandContract): unknown {
  const v = value as Record<string, unknown>;
  switch (contract.shape) {
    case "data_rows": return null;
    case "data_object": case "nested_rows": return v["data"] ?? null;
    case "top_level_rows": { const out: Record<string, unknown> = {}; for (const k of contract.topLevelKeys) if (k !== contract.rowPath && k in v) out[k] = v[k]; return out; }
    case "top_level_object": case "balances_map": return v;
    default: return null;
  }
}

function paginationForContract(value: unknown, contract: CommandContract): unknown {
  if (!contract.paginates) return null;
  const v = value as Record<string, unknown>;
  if (v["pagination"]) return v["pagination"];
  const p: Record<string, unknown> = {};
  for (const k of ["limit","offset","total","hasMore"]) if (k in v) p[k] = v[k];
  return Object.keys(p).length ? p : null;
}
