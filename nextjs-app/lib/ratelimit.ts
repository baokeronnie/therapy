// Small in-memory limiter against password guessing. Per server instance; use Redis/Upstash if you scale out.
const hits = new Map<string, { n: number; reset: number }>();
export function limited(key: string, max = 8, windowMs = 15 * 60_000) {
  const now = Date.now(), h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  h.n++; return h.n > max;
}
export const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
