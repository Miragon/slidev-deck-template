// The session behind the sign-in page.
//
// The site is gated by a sign-in page (see gate.mjs and login.mjs). A
// successful sign-in sets one signed, HttpOnly session cookie; the edge gate
// lets exactly those requests through. The signature is an HMAC-SHA256 over the
// cookie payload. The key is SESSION_SECRET mixed with the credentials, so
// changing the password also revokes every session it signed. The secret is
// REQUIRED once SITE_PASSWORD is set: a key made of the credentials alone can
// be cracked offline from any cookie. Only a local `netlify dev` run falls back
// to a fixed development secret.
//
// Two runtimes import this file - Deno for the edge function, Node for the
// functions - so it must stay free of runtime-specific APIs. The caller passes
// its own env reader in; the Web Crypto global and atob/btoa exist in both.

// Long enough for a multi-day training; signing in again is one form away.
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Collect the credential pair plus the signing secret.
 * @param {(key: string) => string | undefined} get env reader for this runtime
 * @param {{cookieName: string, slug: string, siteUser: string}} config resolved hub config
 */
export function credentialsFrom(get, config) {
    return {
        siteUser: get("SITE_USER") || config.siteUser,
        sitePassword: get("SITE_PASSWORD") || "",
        sessionSecret: get("SESSION_SECRET") || "",
        // Netlify sets CONTEXT to "dev" under `netlify dev`.
        isLocal: get("CONTEXT") === "dev" || get("NETLIFY_DEV") === "true",
        cookieName: config.cookieName,
        keyPrefix: config.slug,
    };
}

/**
 * Does this user/password pair, as entered on the sign-in page, check out?
 * An empty password never authenticates: a variable accidentally left blank
 * must not turn into "no password needed".
 */
export function matchesCredentials(user, password, creds) {
    return Boolean(creds.sitePassword) && user === creds.siteUser && password === creds.sitePassword;
}

// Fixed secret for `netlify dev` only; anywhere else a missing SESSION_SECRET
// means no sessions at all (see sessionKeyMissing).
const LOCAL_DEV_SECRET = "hub-template-local-dev-only";

function sessionSecret(creds) {
    return creds.sessionSecret || (creds.isLocal ? LOCAL_DEV_SECRET : "");
}

/**
 * True when the gate is on but there is no secret to sign sessions with. The
 * site then refuses to start sessions instead of falling back to a key an
 * attacker could derive.
 */
export function sessionKeyMissing(creds) {
    return Boolean(creds.sitePassword) && !sessionSecret(creds);
}

// The HMAC key: the secret first, then the credentials, separated by NUL so
// no concatenation of values can collide.
function keyMaterial(creds) {
    const secret = sessionSecret(creds);
    if (!secret) throw new Error("SESSION_SECRET is not set");
    return [secret, creds.keyPrefix, creds.siteUser, creds.sitePassword].join("\u0000");
}

function hmacKey(creds, usage) {
    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(keyMaterial(creds)),
        { name: "HMAC", hash: "SHA-256" },
        false,
        [usage],
    );
}

const base64url = (bytes) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes)))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");

/**
 * Mint the session cookie VALUE: `v1.<expires>.<signature>`.
 * @param {{now?: number}} [options] clock override for tests, in ms
 */
export async function createSessionValue(creds, options = {}) {
    const now = options.now ?? Date.now();
    const payload = `v1.${now + SESSION_TTL_SECONDS * 1000}`;
    const key = await hmacKey(creds, "sign");
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return `${payload}.${base64url(signature)}`;
}

/**
 * True when the session cookie value proves a sign-in. Checks shape, expiry
 * and signature (crypto.subtle.verify compares in constant time).
 */
export async function verifySessionValue(value, creds, options = {}) {
    const now = options.now ?? Date.now();
    const parts = String(value || "").split(".");
    if (parts.length !== 3) return false;
    const [version, expires, signature] = parts;
    if (version !== "v1") return false;
    if (!sessionSecret(creds)) return false;
    if (!/^\d+$/.test(expires) || Number(expires) <= now) return false;

    let bytes;
    try {
        const decoded = atob(signature.replaceAll("-", "+").replaceAll("_", "/"));
        bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
    } catch {
        return false;
    }
    const key = await hmacKey(creds, "verify");
    const payload = new TextEncoder().encode(`v1.${expires}`);
    return crypto.subtle.verify("HMAC", key, bytes, payload);
}

/** The named cookie out of a `Cookie:` header, or "". */
export function cookieValue(header, name) {
    for (const part of String(header || "").split(";")) {
        const eq = part.indexOf("=");
        if (eq < 0) continue;
        if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
    }
    return "";
}

/** True when the request carries a valid session cookie. */
export async function hasSession(request, creds, options = {}) {
    const value = cookieValue(request.headers.get("cookie"), creds.cookieName);
    return value ? verifySessionValue(value, creds, options) : false;
}

/**
 * The `Set-Cookie` header that stores (or, with maxAge 0, deletes) the session.
 * `Secure` only over https, so `netlify dev` on plain http keeps working.
 */
export function sessionSetCookie(creds, value, { secure, maxAge = SESSION_TTL_SECONDS } = {}) {
    return [
        `${creds.cookieName}=${value}`,
        "Path=/",
        `Max-Age=${maxAge}`,
        "HttpOnly",
        "SameSite=Lax",
        ...(secure ? ["Secure"] : []),
    ].join("; ");
}
