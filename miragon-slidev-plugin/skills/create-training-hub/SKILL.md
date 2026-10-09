---
name: create-training-hub
description: Start a new Miragon training from zero, either a Slidev deck only or a deck plus a Netlify training hub with a sign-in page, and walk through everything that cannot be scaffolded (Netlify project, SITE_PASSWORD, SESSION_SECRET, deploy, sign-in tests, rotating the password after the training). Use whenever someone wants to create a new training, a new training hub, a quickcheck site, a new deck repo with a login, or asks how to set up the Netlify site, the sign-in or the environment variables of a training repo.
---

# Create a training (deck, or deck plus hub)

One command scaffolds the repo; this skill runs it and then guides the person through the steps only a human can do (Netlify, passwords). Answer in the user's language. The scaffolding itself lives in `@miragon/create-slidev-deck` (the `--hub` option) and `@miragon/hub-template` (the sign-in code); do not rewrite their files by hand, run the command.

## 0. Is this the right skill?

- The repo already has `hub.config.mjs` and `netlify/lib/hub/`: it is an existing hub. Do not scaffold again. For a new sign-in version run `npm update @miragon/hub-template && npm run hub:sync`; for Netlify questions use step 5 and 6.
- A deck only, no site: step 1 with `--no-hub`, then stop after step 3.

## 1. Ask, then scaffold

Ask only what is missing:

| Question | Becomes |
|---|---|
| Deck only, or deck plus hub (Netlify site with sign-in)? | `--no-hub` or `--hub` |
| Directory name (lowercase, dashes) | the slug: names the repo, the npm package and the session cookie |
| Title shown on the site and the sign-in page | `--title` |
| Language of the site root, `de` or `en` (the other lives under `/<other>/`) | `--locale` |

Run it in the parent directory where the new repo should live (the target must not exist or be empty):

```bash
npm create @miragon/slidev-deck@latest <dir> -- --hub --title "<Title>" --locale de
```

Always pass `--hub` or `--no-hub`, otherwise the command asks interactively. The command prints what is still to do in Netlify; the same list is in the new repo's `NETLIFY.md`.

**Before `@miragon/hub-template` is published to npm** the command above fails to resolve it. Test from a checkout of `Miragon/slidev-deck-template` instead: `CREATE_DECK_SKELETON=<checkout> node <checkout>/packages/create-deck/bin/index.mjs <dir> --hub ...`, `npm pack -w packages/hub-template`, and point the generated `package.json` devDependency `@miragon/hub-template` at the tarball (`file:/path/to.tgz`) before `npm install`.

## 2. Install and check locally

```bash
cd <dir> && npm install
npm run hub:check        # the managed sign-in code is unedited
npm run build            # deck into /slides/, sign-in pages, site
```

`npm run dev` serves the deck, `npm run dev:site` the hub. Content goes into `deck/` (use the `slides` skill) and `site/docs/` (plain Markdown, German and English).

## 3. Put it on GitHub

Ask before creating anything remote: organisation, repository name, visibility. Training material usually belongs in a **private** repository. Then `git init`, commit, `gh repo create`, push. Never commit a password or the session secret.

## 4. Netlify (hub only, the person does this)

Walk through it one step at a time and wait for the answer; the person clicks, you explain.

1. Netlify → Add new project → Import from Git → the repository. The build settings come from `netlify.toml`. **Do not deploy yet.**
2. Environment variables (Site configuration → Environment variables → Add a variable). For both, tick **Contains secret values**; Netlify then switches to "Specific scopes": keep **Builds**, **Functions** and **Runtime** ticked.
   - `SITE_PASSWORD`: the password shared with participants. Suggest generating a strong one.
   - `SESSION_SECRET`: **required**, a long random value. Have the person generate it in their own terminal with `openssl rand -base64 48` and paste it into Netlify. Do not generate it in the chat, do not write it to a file.
   - `SITE_USER`: optional, default `training`.
3. Deploy (Deploys → Trigger deploy).

If `SESSION_SECRET` is missing the site answers **503** and the sign-in 500. That is on purpose (a key made of the credentials alone can be cracked offline from a participant's cookie), not a bug: set the variable and redeploy.

## 5. Test the deployed site

Ask for the site URL, then check. The person can do it in a private window; these are the checks:

1. The start page redirects to `/login` (not a 503 page): `curl -sI https://<site>/ | head -3` shows a 302 to `/login/?to=%2F`.
2. Signing in with the user and password lands on the start page.
3. Open redirect is closed: `https://<site>/login/?to=/%5Cevil.com`, sign in, you must land on the start page, never on evil.com.
4. Rate limit: more than 10 wrong sign-ins within a minute, the next answer is **429**. `for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code}\n" -X POST -d "user=x&password=wrong" https://<site>/api/login; done` shows 303 and then 429. Run it only against the person's own site, and say so before you do.

If a check fails, report what the response was and go back to step 4; do not weaken the gate.

## 6. During and after the training

- Share the user name and password out of band (calendar entry, start of the training), not in the repo.
- After the training: set a new `SITE_PASSWORD` in Netlify and redeploy. A new password ends every open session; so does a new `SESSION_SECRET`. A deploy always ends all sessions, so do not deploy in the middle of an exercise.
- Keeping the sign-in code current: `npm update @miragon/hub-template && npm run hub:sync`. CI (`hub:check`) fails when `netlify/lib/hub/` was edited by hand or is stale.

## Things that are easy to get wrong

- Editing anything in `netlify/lib/hub/`: it is managed and overwritten by `hub:sync`. Change `hub.config.mjs` or the wrappers in `netlify/functions/` instead.
- Opening `/.netlify/functions/login` as a way around the rate limit: the gate keeps it closed, do not add it to the open paths.
- Roles (a trainer who releases solutions) are not part of the template. The BPM training has them; a plain hub has one credential pair.
- The sign-in pages in `site/docs/public/login/` are generated and git-ignored: change the texts in `@miragon/hub-template`, not in the output.
