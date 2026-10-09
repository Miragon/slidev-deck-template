// Ends the session: deletes the cookie and lands on the sign-in page.
//
//   POST /api/logout   (lang=<other> for the second language; GET works too)

import { langOf, loginPath, resolveConfig } from "./config.mjs";
import { credentialsFrom, sessionSetCookie } from "./session.mjs";

/** The Netlify function handler for `config` (the raw hub.config.mjs export). */
export function createLogout(rawConfig, getEnv = (key) => process.env[key]) {
    const config = resolveConfig(rawConfig);

    return async (request) => {
        const url = new URL(request.url);
        let lang = url.searchParams.get("lang");
        if (request.method === "POST") {
            try {
                lang = String((await request.formData()).get("lang") ?? lang ?? "");
            } catch {
                // No form body is fine; the query parameter decides.
            }
        }
        const creds = credentialsFrom(getEnv, config);

        return new Response(null, {
            status: 303,
            headers: {
                location: new URL(loginPath(config, langOf(config, lang)), url).toString(),
                "set-cookie": sessionSetCookie(creds, "", { secure: url.protocol === "https:", maxAge: 0 }),
                "cache-control": "no-store",
            },
        });
    };
}
