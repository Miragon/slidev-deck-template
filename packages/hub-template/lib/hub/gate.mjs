// Netlify Edge Function body: the sign-in gate for the whole site.
//
// Anyone without a valid session cookie is sent to the sign-in page, which
// brings them back to the page they asked for. Configure the credentials in
// Netlify → Site configuration → Environment variables:
//
//   SITE_USER      (optional, default from hub.config.mjs, usually "training")
//   SITE_PASSWORD  (required to enable the gate)
//   SESSION_SECRET (cookie-signing key, REQUIRED once SITE_PASSWORD is set)
//
// Safety: if SITE_PASSWORD is not set, the gate is DISABLED, so a missing
// variable never locks you out (and local/preview builds stay open).
//
// What an anonymous visitor may fetch: the sign-in pages, the endpoints that
// start and end a session, and the few self-contained assets those pages use.
// The sign-in pages carry their styles inline on purpose; the site's /assets/
// bundles contain every page's content and must stay behind the gate.
// /.netlify/functions/login is deliberately NOT open: the rate limit hangs on
// /api/login, so the raw function path would be a way around it.

import { loginPath, resolveConfig } from "./config.mjs";
import { credentialsFrom, hasSession, sessionKeyMissing } from "./session.mjs";

/** The edge handler for `config` (the raw hub.config.mjs export). */
export function createGate(rawConfig, getEnv = (key) => Deno.env.get(key)) {
    const config = resolveConfig(rawConfig);
    const open = new Set([
        "/login",
        "/login/",
        `/${config.other}/login`,
        `/${config.other}/login/`,
        "/api/login",
        "/api/logout",
        "/.netlify/functions/logout",
        "/favicon.ico",
        "/logo.svg",
        "/komet.svg",
        "/miragon-logo.svg",
    ]);

    return async (request) => {
        const creds = credentialsFrom(getEnv, config);

        // No password configured → do not gate.
        if (!creds.sitePassword) return;

        // Gate on, but no SESSION_SECRET: nobody could sign in. Fail loudly
        // instead of sending visitors round a login that cannot succeed.
        if (sessionKeyMissing(creds)) {
            return new Response("SESSION_SECRET is not configured. Set it in the Netlify environment variables.", {
                status: 503,
                headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
            });
        }

        const url = new URL(request.url);
        const path = url.pathname;
        if (open.has(path) || path.startsWith("/fonts/")) return;

        if (await hasSession(request, creds)) return; // signed in → continue

        // An API call answers in JSON: a redirect would hand fetch() a login
        // page where it expects data.
        if (path.startsWith("/api/") || path.startsWith("/.netlify/")) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
                status: 401,
                headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
            });
        }

        // Everything else goes to the sign-in page, which brings the visitor
        // back to the page they actually asked for.
        const lang = path === `/${config.other}` || path.startsWith(`/${config.other}/`) ? config.other : config.locale;
        const to = encodeURIComponent(path + url.search);
        return Response.redirect(new URL(`${loginPath(config, lang)}?to=${to}`, url), 302);
    };
}
