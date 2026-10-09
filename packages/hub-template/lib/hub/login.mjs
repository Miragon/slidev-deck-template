// Starts a session: the target of the sign-in form on /login and /<other>/login.
//
//   POST /api/login   user=…&password=…&to=/exercises&lang=de
//
// Correct credentials answer with the session cookie (signed by ./session.mjs)
// and a redirect to the page the visitor originally asked for; wrong ones go
// back to the sign-in page, which reads ?error=1 and says so. Plain form posts
// and 303 redirects on purpose: the page works without JavaScript, and
// password managers see a form they understand.
//
// The netlify/functions/login.mjs wrapper adds the `config` export (route and
// rate limit), because Netlify reads that statically from the function file.

import { langOf, loginPath, resolveConfig, startPath } from "./config.mjs";
import {
    createSessionValue,
    credentialsFrom,
    matchesCredentials,
    sessionKeyMissing,
    sessionSetCookie,
} from "./session.mjs";

const PLACEHOLDER = "https://x.invalid";

/**
 * Only a path on this site may be a redirect target. Anything else would make
 * the login an open redirect, so it falls back to `fallback`. A regex is not
 * enough here: the URL parser treats "\" like "/" and drops tabs and newlines,
 * so "/\evil.com" and "/\t/evil.com" both resolve to another origin. So parse
 * it the way the redirect will and compare the origin.
 */
export function safeTarget(raw, fallback = "/") {
    const target = String(raw || "");
    if (!target.startsWith("/")) return fallback;
    let url;
    try {
        url = new URL(target, PLACEHOLDER);
    } catch {
        return fallback;
    }
    return url.origin === PLACEHOLDER ? url.pathname + url.search + url.hash : fallback;
}

const redirect = (url, to, headers = {}) =>
    new Response(null, {
        status: 303,
        headers: { location: new URL(to, url).toString(), "cache-control": "no-store", ...headers },
    });

const json = (status, body) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });

/** The Netlify function handler for `config` (the raw hub.config.mjs export). */
export function createLogin(rawConfig, getEnv = (key) => process.env[key]) {
    const config = resolveConfig(rawConfig);

    return async (request) => {
        if (request.method !== "POST") return json(405, { error: "method not allowed" });

        let form;
        try {
            form = await request.formData();
        } catch {
            return json(400, { error: "invalid form" });
        }

        const user = String(form.get("user") ?? "");
        const password = String(form.get("password") ?? "");
        const lang = langOf(config, form.get("lang"));
        const to = safeTarget(form.get("to"), startPath(config, lang));

        const creds = credentialsFrom(getEnv, config);

        // Gate off → there is nothing to sign in to; just go where you were going.
        if (!creds.sitePassword) return redirect(request.url, to);

        // Gate on but nothing to sign with: say so, rather than start a session
        // nobody could verify (or one signed with a guessable key).
        if (sessionKeyMissing(creds)) return json(500, { error: "SESSION_SECRET is not configured" });

        if (!matchesCredentials(user, password, creds)) {
            return redirect(request.url, `${loginPath(config, lang)}?error=1&to=${encodeURIComponent(to)}`);
        }

        const value = await createSessionValue(creds);
        return redirect(request.url, to, {
            "set-cookie": sessionSetCookie(creds, value, {
                secure: new URL(request.url).protocol === "https:",
            }),
        });
    };
}
