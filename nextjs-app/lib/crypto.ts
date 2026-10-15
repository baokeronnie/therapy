import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function key(): Buffer {
  const k = process.env.DATA_ENCRYPTION_KEY;
  if (k) { const b = Buffer.from(k, "base64"); if (b.length === 32) return b; throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32)."); }
  if (process.env.NODE_ENV === "production") throw new Error("DATA_ENCRYPTION_KEY is required in production.");
  return createHash("sha256").update("dev-only:" + (process.env.SESSION_SECRET ?? "dev")).digest(); // local development only
}

/** Encrypts a string for storage. Output looks like "v1.<iv>.<tag>.<ciphertext>" (base64). */
export function enc(plain?: string | null): string | null {
  if (plain == null || plain === "") return null;
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(".");
}
export function dec(stored?: string | null): string | null {
  if (!stored) return null;
  const [v, iv, tag, ct] = stored.split(".");
  if (v !== "v1" || !iv || !tag || !ct) return null;
  try {
    const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
  } catch { return null; }
}
