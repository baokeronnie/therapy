import "server-only";
import { createHash, randomBytes } from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Authgear OpenID Connect (authorization code + PKCE). Nothing here is sent to the browser except redirects.
 *   AUTHGEAR_ENDPOINT   https://<project>.authgear.cloud
 *   AUTHGEAR_CLIENT_ID  the application's client id
 *   AUTHGEAR_REDIRECT_URI  must exactly match an "Authorized Redirect URI" in the Authgear portal
 *   AUTHGEAR_CLIENT_SECRET  only if the portal app is a confidential "Traditional Web App" (leave empty for SPA/PKCE)
 */
export const SCOPE = "openid https://authgear.com/scopes/full-userinfo"; // full-userinfo = email, phone, name in the token

export function cfg() {
  const endpoint = (process.env.AUTHGEAR_ENDPOINT ?? "").replace(/\/+$/, "");
  const clientId = process.env.AUTHGEAR_CLIENT_ID ?? "";
  if (!endpoint || !clientId) throw new Error("AUTHGEAR_ENDPOINT and AUTHGEAR_CLIENT_ID must be set.");
  const redirectUri = process.env.AUTHGEAR_REDIRECT_URI || `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/callback`;
  return { endpoint, clientId, redirectUri, secret: process.env.AUTHGEAR_CLIENT_SECRET || undefined, postLogout: process.env.AUTHGEAR_POST_LOGOUT_REDIRECT_URI || undefined };
}

type Meta = { issuer: string; authorization_endpoint: string; token_endpoint: string; userinfo_endpoint?: string; jwks_uri: string; end_session_endpoint?: string };
let cache: { at: number; meta: Meta } | undefined;
export async function meta(): Promise<Meta> {
  if (cache && Date.now() - cache.at < 3600_000) return cache.meta;
  const { endpoint } = cfg();
  let m: Meta;
  try {
    const r = await fetch(`${endpoint}/.well-known/openid-configuration`, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    m = await r.json();
  } catch { // documented Authgear defaults if discovery is unreachable
    m = { issuer: endpoint, authorization_endpoint: `${endpoint}/oauth2/authorize`, token_endpoint: `${endpoint}/oauth2/token`, userinfo_endpoint: `${endpoint}/oauth2/userinfo`, jwks_uri: `${endpoint}/oauth2/jwks`, end_session_endpoint: `${endpoint}/oauth2/end_session` };
  }
  cache = { at: Date.now(), meta: m };
  return m;
}

const b64u = (b: Buffer) => b.toString("base64url");
export async function authorizeUrl() {
  const { clientId, redirectUri } = cfg(), m = await meta();
  const verifier = b64u(randomBytes(48)), state = b64u(randomBytes(24)), nonce = b64u(randomBytes(24));
  const u = new URL(m.authorization_endpoint);
  u.search = new URLSearchParams({ response_type: "code", client_id: clientId, redirect_uri: redirectUri, scope: SCOPE, state, nonce,
    code_challenge: b64u(createHash("sha256").update(verifier).digest()), code_challenge_method: "S256" }).toString();
  return { url: u.toString(), state, nonce, verifier };
}

export type Identity = { sub: string; email?: string; emailVerified: boolean; name?: string; phone?: string; idToken: string };
/** Exchanges the code, verifies the ID token (signature, issuer, audience, nonce) and returns who signed in. */
export async function completeLogin(code: string, verifier: string, nonce: string): Promise<Identity> {
  const { clientId, redirectUri, secret } = cfg(), m = await meta();
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: clientId, code_verifier: verifier });
  if (secret) body.set("client_secret", secret);
  const r = await fetch(m.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  if (!r.ok) throw new Error("token_exchange_failed");
  const t = await r.json();
  if (!t.id_token) throw new Error("no_id_token");
  const { payload } = await jwtVerify(t.id_token, createRemoteJWKSet(new URL(m.jwks_uri)), { issuer: m.issuer, audience: clientId });
  if (payload.nonce !== nonce) throw new Error("bad_nonce");
  let c: Record<string, any> = payload;
  if (!c.email && t.access_token && m.userinfo_endpoint) {
    const u = await fetch(m.userinfo_endpoint, { headers: { Authorization: `Bearer ${t.access_token}` }, cache: "no-store" });
    if (u.ok) c = { ...c, ...(await u.json()) };
  }
  return { sub: String(c.sub), email: c.email ? String(c.email).toLowerCase() : undefined, emailVerified: c.email_verified === true,
    name: c.name || [c.given_name, c.family_name].filter(Boolean).join(" ") || undefined, phone: c.phone_number, idToken: t.id_token };
}

/** URL that ends the Authgear browser session too (so the next sign-in asks for credentials again). */
export async function logoutUrl(idToken?: string | null) {
  const { postLogout } = cfg(), m = await meta();
  if (!postLogout || !idToken || !m.end_session_endpoint) return null;
  const u = new URL(m.end_session_endpoint);
  u.search = new URLSearchParams({ id_token_hint: idToken, post_logout_redirect_uri: postLogout }).toString();
  return u.toString();
}
export const accountSettingsUrl = () => `${cfg().endpoint}/settings`;
