/** Omit keys whose values are undefined (for exactOptionalPropertyTypes-safe payloads). */
export function omitUndefined<T extends Record<string, unknown>>(obj: T): { [K in keyof T]?: T[K] } {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const v = obj[key];
    if (v !== undefined) out[key] = v;
  }
  return out;
}
