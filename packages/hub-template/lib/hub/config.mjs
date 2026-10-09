// The per-training settings, read from `hub.config.mjs` in the repo root.
//
//   export default {
//     slug: "my-training",        // names the session cookie (my_training_session)
//     title: "My Training",       // shown on the sign-in page
//     locale: "de",               // language of the site root: "de" or "en"
//     siteUser: "training",       // default user name (SITE_USER overrides it)
//   }
//
// The other language lives under /<other>/, as in the training hubs this was
// taken from. Only "de" and "en" have sign-in texts.

export const LOCALES = ["de", "en"];

/** The config with defaults filled in, or an Error saying what is wrong. */
export function resolveConfig(raw = {}) {
    const slug = String(raw.slug ?? "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
        throw new Error(`hub.config: "slug" must be lowercase letters, digits and dashes, got ${JSON.stringify(raw.slug)}`);
    }
    const locale = raw.locale ?? "de";
    if (!LOCALES.includes(locale)) {
        throw new Error(`hub.config: "locale" must be one of ${LOCALES.join(", ")}, got ${JSON.stringify(locale)}`);
    }
    return {
        slug,
        title: String(raw.title ?? slug),
        locale,
        other: LOCALES.find((l) => l !== locale),
        siteUser: String(raw.siteUser ?? "training"),
        cookieName: `${slug.replaceAll("-", "_")}_session`,
    };
}

/** Path of the sign-in page for a language: the root language lives at /login/. */
export const loginPath = (config, lang) => (lang === config.other ? `/${config.other}/login/` : "/login/");

/** Start page for a language. */
export const startPath = (config, lang) => (lang === config.other ? `/${config.other}/` : "/");

/** The language a form field or query value names; anything unknown is the root language. */
export const langOf = (config, value) => (value === config.other ? config.other : config.locale);
