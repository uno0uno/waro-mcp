import type { WaroConfig } from "./config.js";

export class WaroClient {
  constructor(private config: WaroConfig) {}

  async post(path: string, body: unknown): Promise<unknown> {
    const url = `${this.config.apiUrl}${path}`;
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.config.apiKey}`, "Content-Type": "application/json", "User-Agent": "waro-mcp/0.1.0" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new Error(`Cannot reach ${this.config.apiUrl} — check WARO_API_URL: ${String(e)}`);
    }
    return this.handleResponse(resp);
  }

  async get(path: string): Promise<unknown> {
    const url = `${this.config.apiUrl}${path}`;
    let resp: Response;
    try {
      resp = await fetch(url, { headers: { Authorization: `Bearer ${this.config.apiKey}`, "User-Agent": "waro-mcp/0.1.0" } });
    } catch (e) {
      throw new Error(`Cannot reach ${this.config.apiUrl}: ${String(e)}`);
    }
    return this.handleResponse(resp);
  }

  private async handleResponse(resp: Response): Promise<unknown> {
    const json = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) {
      const detail = (json["detail"] as string) ?? (json["message"] as string) ?? "";
      switch (resp.status) {
        case 401: throw new Error("Invalid API key. Check WARO_API_KEY.");
        case 403: throw new Error(detail ? `Insufficient scope: ${detail}` : "Insufficient scope. Requires higher-privilege key.");
        case 404: throw new Error("Resource not found.");
        case 422: throw new Error(detail ? `Invalid request: ${detail}` : "Invalid request (422). Check params.");
        case 429: throw new Error("Rate limit exceeded. Try again later.");
        default:
          if (resp.status >= 500) throw new Error(`Server error (${resp.status}). Try again later.`);
          throw new Error(`API error ${resp.status}: ${detail}`);
      }
    }
    return json;
  }
}
