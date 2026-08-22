export function validateSafeString(name: string, val: string): void {
  if (val.includes("../") || val.includes("..\\")) throw new Error(`invalid value for --${name}: path traversal not allowed`);
  if (val.includes("\0")) throw new Error(`invalid value for --${name}: null bytes not allowed`);
  if (val.includes("\r") || val.includes("\n")) throw new Error(`invalid value for --${name}: newline characters not allowed`);
  if (val.includes("?")) throw new Error(`invalid value for --${name}: embedded query parameters not allowed`);
}

export function validateUuid(name: string, val: string): void {
  validateSafeString(name, val);
  const parts = val.split("-");
  const valid =
    parts.length === 5 &&
    parts[0].length === 8 &&
    parts[1].length === 4 &&
    parts[2].length === 4 &&
    parts[3].length === 4 &&
    parts[4].length === 12 &&
    parts.every((p) => [...p].every((c) => /[0-9a-fA-F]/.test(c)));
  if (!valid) throw new Error(`invalid value for --${name}: expected UUID format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
}

export function validateDate(name: string, val: string): void {
  validateSafeString(name, val);
  const parts = val.split("-");
  const valid =
    parts.length === 3 &&
    parts[0].length === 4 &&
    parts[1].length === 2 &&
    parts[2].length === 2 &&
    parts.every((p) => /^\d+$/.test(p)) &&
    (() => {
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return m >= 1 && m <= 12 && d >= 1 && d <= 31;
    })();
  if (!valid) throw new Error(`invalid value for --${name}: expected date format YYYY-MM-DD (e.g. 2026-03-01)`);
}

export function validateEnum(name: string, val: string, options: string[]): void {
  if (!options.includes(val)) throw new Error(`invalid value for --${name}: '${val}' is not allowed. Valid values: ${options.join(", ")}`);
}

export function validateFields(contractFields: string[], fields?: string): void {
  if (!fields) return;
  const keys = fields.split(",").map((s) => s.trim()).filter(Boolean);
  for (const k of keys) {
    if (!contractFields.includes(k)) throw new Error(`unknown field '${k}'. Available: ${contractFields.join(", ")}`);
  }
}
