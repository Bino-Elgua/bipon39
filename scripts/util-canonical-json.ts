/**
 * Deterministic JSON serialization (RFC8785-inspired, simplified):
 * - Sort object keys lexicographically
 * - Preserve array order
 * - Encode strings as-is (inputs must already be normalized)
 */
export function canonicalize(value: any): string {
  return JSON.stringify(sortRec(value));
}

function sortRec(v: any): any {
  if (Array.isArray(v)) return v.map(sortRec);
  if (v && typeof v === 'object') {
    const out: any = {};
    for (const k of Object.keys(v).sort()) out[k] = sortRec(v[k]);
    return out;
  }
  return v;
}
