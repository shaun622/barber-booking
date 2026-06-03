// Structural KV type — avoids version skew between @cloudflare/workers-types
// and the adapter-cloudflare-bundled types.
interface MinimalKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Token-bucket-ish rate limit using KV.
 * Returns true if the request is allowed, false if it should be rejected.
 */
export async function rateLimit(
  kv: MinimalKV,
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const bucketKey = `rl:${key}:${Math.floor(now / windowSec)}`;
  const raw = await kv.get(bucketKey);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= limit) return false;
  await kv.put(bucketKey, String(count + 1), { expirationTtl: windowSec * 2 });
  return true;
}

export async function acquireSlotLock(
  kv: MinimalKV,
  slotKey: string,
  ttlSec = 300
): Promise<boolean> {
  const existing = await kv.get(slotKey);
  if (existing) return false;
  await kv.put(slotKey, '1', { expirationTtl: ttlSec });
  return true;
}

export async function releaseSlotLock(kv: MinimalKV, slotKey: string): Promise<void> {
  await kv.delete(slotKey);
}

export function buildSlotKey(barberId: number | null, startsAt: string): string {
  return `lock:${barberId ?? 'any'}:${startsAt}`;
}
