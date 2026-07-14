import { createHmac, randomBytes } from "node:crypto";

// Rate limiting per IP, KUN i minnet (PLAN.md seksjon 10): IP-en HMAC-hashes
// med en hemmelighet som bare finnes i prosessminnet og roteres ved omstart,
// slik at selv minneinnholdet ikke kan slås opp mot en IP i etterkant.
// Ingenting skrives til disk eller logges.

const SECRET = randomBytes(32);

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const MAX_BUCKETS = 50_000;

function hashIp(ip: string): string {
  return createHmac("sha256", SECRET).update(ip).digest("base64");
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Returnerer true hvis forespørselen er innenfor grensen. */
export function allowRequest(request: Request): boolean {
  const now = Date.now();
  const key = hashIp(clientIp(request));

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) {
        if (b.resetAt < now) buckets.delete(k);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= MAX_PER_WINDOW;
}
