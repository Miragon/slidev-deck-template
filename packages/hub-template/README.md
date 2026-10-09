# @miragon/hub-template

The training hub for a Miragon Slidev deck: a Netlify site with a sign-in page,
a VitePress site for setup, agenda, exercises and resources, and the deck
embedded behind the same gate. Every training repo used to build this by hand;
this package is the one copy.

```bash
npm create @miragon/slidev-deck@latest my-training -- --hub --title "My Training" --locale de
```

Without `--hub` you get the deck only. In a terminal, the scaffold asks.

## What you get

| Path | What it is |
|---|---|
| `hub.config.mjs` | slug, title, root language (`de` or `en`), default user name |
| `netlify/functions/login.mjs`, `logout.mjs` | thin wrappers; the login carries the route and the rate limit (10 attempts per minute and IP) |
| `netlify/edge-functions/auth.js` | the gate for every path |
| `netlify/lib/hub/` | the managed sign-in code (session, login, logout, gate, login pages). **Do not edit** |
| `scripts/build-login-pages.mjs` | writes the two sign-in pages from the config at build time |
| `scripts/build-slides.mjs` | builds `deck/` into `site/docs/public/slides/` |
| `site/` | VitePress hub, German and English |
| `NETLIFY.md` | the steps that cannot be scaffolded: variables, deploy, tests |
| `.github/workflows/hub.yml` | `hub:check` plus the full build |

## What the sign-in guarantees

- Sessions are an HMAC-signed `HttpOnly` cookie. The key is `SESSION_SECRET` mixed with the credentials, so rotating the password ends every session.
- `SESSION_SECRET` is **required** once `SITE_PASSWORD` is set. Without it the sign-in answers 500 and every page 503, because a key made of the credentials alone can be cracked offline from any participant's own cookie. Only `netlify dev` works without it.
- The redirect target after sign-in is parsed and compared by origin (`/\evil.com`, `/\t/evil.com` and the like fall back to the start page).
- `/.netlify/functions/login` is not open in the gate, so the rate limit on `/api/login` cannot be walked around.

## Why the code is copied into the repo

The edge function runs on Deno and the functions on Node, and Netlify bundles them
separately, so importing from `node_modules` is not reliable for both. The shared
code is vendored into `netlify/lib/hub/` instead, and two commands keep it honest:

```bash
npm update @miragon/hub-template && npm run hub:sync   # take a new version
npm run hub:check                                      # CI: fails when the copy differs
```

## Configuration

```js
// hub.config.mjs
export default {
    slug: "my-training",   // names the cookie: my_training_session
    title: "My Training",  // sign-in page and site title
    locale: "de",          // root language; the other lives under /<other>/
    siteUser: "training",  // default user name, SITE_USER overrides it
};
```

## Scope

One credential pair. Roles (a trainer who releases solutions) are deliberately not
part of this: the BPM training has them, the template does not.
