import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface WaroConfig {
  apiUrl: string;
  apiKey: string;
  profileName?: string;
}

function nonEmptyEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

function parseTomlProfiles(content: string): Record<string, { api_url?: string; api_key: string }> {
  // Minimal TOML parser for [profiles.NAME] only
  const profiles: Record<string, { api_url?: string; api_key: string }> = {};
  let current: string | undefined;
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("[profiles.")) {
      const m = line.match(/\[profiles\.([^\]]+)\]/);
      if (m) { current = m[1]; profiles[current] = { api_key: "" }; }
      continue;
    }
    if (!current) continue;
    const kv = line.match(/^(\w+)\s*=\s*"?([^"]*)"?\s*$/);
    if (!kv) continue;
    const [, k, v] = kv;
    if (k === "api_url") profiles[current].api_url = v;
    if (k === "api_key") profiles[current].api_key = v;
  }
  return profiles;
}

export function loadConfig(): WaroConfig {
  const profileArg = nonEmptyEnv("WARO_PROFILE");
  // If WARO_PROFILE set, must load that profile
  if (profileArg) return fromProfile(profileArg);

  // Try default profile with env overrides
  const home = process.env.HOME ?? homedir();
  const path = join(home, ".waro", "config.toml");
  if (existsSync(path)) {
    try {
      const content = readFileSync(path, "utf-8");
      const profiles = parseTomlProfiles(content);
      if (profiles["default"]) {
        const cfg = fromProfile("default");
        const apiUrl = nonEmptyEnv("WARO_API_URL");
        const apiKey = nonEmptyEnv("WARO_API_KEY");
        if (apiUrl) cfg.apiUrl = apiUrl;
        if (apiKey) cfg.apiKey = apiKey;
        return cfg;
      }
    } catch {}
  }
  return fromEnvVars();
}

function fromProfile(name: string): WaroConfig {
  const home = process.env.HOME ?? homedir();
  if (!home) throw new Error("HOME env var not set");
  const path = join(home, ".waro", "config.toml");
  let content: string;
  try { content = readFileSync(path, "utf-8"); } catch { throw new Error(`Cannot read config file: ${path}`); }
  const profiles = parseTomlProfiles(content);
  const p = profiles[name];
  if (!p) {
    const avail = Object.keys(profiles).join(", ") || "(none)";
    throw new Error(`profile '${name}' not found in ${path}. Available profiles: ${avail}`);
  }
  if (!p.api_key) throw new Error(`api_key is empty for profile '${name}' in ${path}`);
  return { apiUrl: p.api_url ?? "https://api.warolabs.com", apiKey: p.api_key, profileName: name };
}

function fromEnvVars(profileName?: string): WaroConfig {
  const apiUrl = nonEmptyEnv("WARO_API_URL") ?? "https://api.warolabs.com";
  const apiKey = nonEmptyEnv("WARO_API_KEY");
  if (!apiKey) throw new Error("WARO_API_KEY env var is required. Set it in env or ~/.waro/config.toml");
  return { apiUrl, apiKey, profileName };
}
