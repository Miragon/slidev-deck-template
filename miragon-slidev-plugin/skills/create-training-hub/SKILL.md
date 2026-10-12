---
name: create-training-hub
description: Start a new Miragon training from zero, either a Slidev deck only or a deck plus a Netlify training hub with a sign-in page, as a checklist playbook that shows what is done, what is next and who acts (Claude or the person): scaffold, GitHub, Netlify project, SITE_PASSWORD, SESSION_SECRET, deploy, sign-in tests, rotating the password after the training. Use whenever someone wants to create a new training, a new training hub, a quickcheck site, a new deck repo with a login, or asks how to set up the Netlify site, the sign-in or the environment variables of a training repo.
---

# Create a training (deck, or deck plus hub)

A playbook, not a conversation. One command scaffolds the repo; the rest is a checklist that Claude and the person work through together. The scaffolding lives in `@miragon/create-slidev-deck` (the `--hub` option) and `@miragon/hub-template` (the sign-in code): run the command, do not rewrite their files by hand. Answer in the user's language.

## How to run this skill

1. **Show the checklist first**, in the user's language, with every item open. Show it again, with updated marks, after every phase. Marks: `[x]` done, `[ ]` open, `→` the item you are on. Every item says who acts: **Claude** (you run it) or **Du** (only the person can: clicks in Netlify, passwords).
2. **One phase at a time.** End each message with the single next action ("Als Nächstes: 3.1, du öffnest Netlify und ..."). On a **Du** item, wait for the answer; never mark it done on assumption, ask.
3. **Leave out what does not apply.** Deck only: show phases 1, 2 and 5.1 only. Existing hub (see step 0): no scaffold.
4. **Finish with the definition of done** (last section).

## The checklist (show this)

```
Training anlegen: <Name>

Phase 1  Vorbereiten
  [ ] 1.1  Fragen klären: Hub oder nur Deck, Name, Titel, Sprache      Claude fragt
  [ ] 1.2  Repo erzeugen (npm create @miragon/slidev-deck)             Claude
  [ ] 1.3  Lokal prüfen: install, hub:check, build                     Claude

Phase 2  GitHub
  [ ] 2.1  Privates Repo anlegen und pushen                            Claude, nach Rückfrage

Phase 3  Netlify (nur Hub)
  [ ] 3.1  Projekt aus dem Repo importieren, NOCH NICHT deployen       Du
  [ ] 3.2  Base directory leer lassen                                  Du
  [ ] 3.3  SITE_PASSWORD setzen (Secret)                               Du
  [ ] 3.4  SESSION_SECRET setzen (Secret)                              Du
  [ ] 3.5  Deployen                                                    Du

Phase 4  Testen (nur Hub)
  [ ] 4.1  Startseite leitet auf /login um                             Claude
  [ ] 4.2  Anmelden (Benutzer: training), Startseite öffnet            Du
  [ ] 4.3  Seite "Folien" zeigt das Deck                               Du
  [ ] 4.4  Redirect-Schutz nach der Anmeldung                          Du
  [ ] 4.5  Rate-Limit: 429 nach 10 Fehlversuchen                       Claude, nach Ankündigung

Phase 5  Danach
  [ ] 5.1  Deck und Seiten mit Inhalt füllen (slides skill)            Du + Claude
  [ ] 5.2  Nach dem Training: neues Passwort, neu deployen             Du
```

## Step 0: is this the right skill?

- The repo already has `hub.config.mjs` and `netlify/lib/hub/`: it is an existing hub. Do not scaffold again. For a new sign-in version run `npm update @miragon/hub-template && npm run hub:sync`; for Netlify questions go to phase 3 and 4.
- A deck only, no site: `--no-hub`, then phases 1 and 2, and 5.1.

## Phase 1: Vorbereiten

**1.1** Ask only what is missing:

| Question | Becomes |
|---|---|
| Deck only, or deck plus hub (Netlify site with sign-in)? | `--no-hub` or `--hub` |
| Directory name (lowercase, dashes) | the slug: names the repo, the npm package and the session cookie |
| Title shown on the site and the sign-in page | `--title` |
| Language of the site root, `de` or `en` (the other lives under `/<other>/`) | `--locale` |

**1.2** Run it in the parent directory where the new repo should live (the target must not exist or be empty). Always pass `--hub` or `--no-hub`, otherwise the command asks interactively:

```bash
npm create @miragon/slidev-deck@latest <dir> -- --hub --title "<Title>" --locale de
```

The command prints the Netlify to-do list; the same list is in the new repo's `NETLIFY.md`.

**1.3**

```bash
cd <dir> && npm install
npm run hub:check        # the managed sign-in code is unedited
npm run build            # deck into /deck/, sign-in pages, site
```

`npm run dev` serves the deck, `npm run dev:site` the hub. The scaffold contains the Miragon template deck as a starting point; it is built into the hub at `/deck/` and shown on the hub's Slides page. Filling it with content is 5.1.

## Phase 2: GitHub

**2.1** Ask before creating anything remote: organisation or account, repository name, visibility. Training material usually belongs in a **private** repository. Then `git init`, commit, `gh repo create`, push. Never commit a password or the session secret.

## Phase 3: Netlify (the person clicks, you explain)

Go through it one item at a time and wait for the answer.

**3.1** Netlify → Add new project → Import from Git → the repository. The build settings come from `netlify.toml`. **Do not deploy yet.**

**3.2** Tell the person plainly: **leave Base directory empty**, and if it contains anything (Netlify often fills in `site`), delete the content. It is under Site configuration → Build & deploy → Build settings → Base directory. Do not hedge or say "may". A wrong value breaks the build with "Deploy directory 'site/site/docs/.vitepress/dist' does not exist". Ask the person to confirm the field is empty before 3.3.

**3.3 and 3.4** Environment variables (Site configuration → Environment variables → Add a variable). For both, tick **Contains secret values**; Netlify then switches to "Specific scopes": keep **Builds**, **Functions** and **Runtime** ticked.

- `SITE_PASSWORD`: the password shared with participants. Suggest a strong one.
- `SESSION_SECRET`: **required**, a long random value. The person generates it in their own terminal with `openssl rand -base64 48` and pastes it into Netlify. Do not generate it in the chat, do not write it to a file.
- `SITE_USER`: optional, default `training`. The sign-in page asks for a user name, so tell the person the user name (the default, unless they set `SITE_USER`) and that participants need it too.
- A secret cannot be read again after saving. To change one: the variable → Edit → new value → save, then **deploy again**; without a new deploy the old value stays active.

**3.5** Deploy (Deploys → Trigger deploy).

If `SESSION_SECRET` is missing the site answers **503** and the sign-in 500. That is on purpose (a key made of the credentials alone can be cracked offline from a participant's cookie), not a bug: set the variable and redeploy.

## Phase 4: Test the deployed site

Ask for the site URL first.

- **4.1** `curl -sI https://<site>/ | head -3` shows a 302 to `/login/?to=%2F` (not a 503 page).
- **4.2** The person signs in with the user name (`training` unless `SITE_USER` is set) and the password, in a private window. The start page opens.
- **4.3** The person opens "Folien" in the navigation. The page shows the title slide of the deck inside the hub, with a link to open it fullscreen (`/deck/`). If the frame is empty or shows the hub itself, report it; do not work around it.
- **4.4** Open redirect is closed: `https://<site>/login/?to=/%5Cevil.com`, sign in, the person must land on the start page, never on evil.com.
- **4.5** Rate limit: more than 10 wrong sign-ins within a minute, the next answer is **429**. Say first that you will run it against the person's own site, then: `for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code}\n" -X POST -d "user=x&password=wrong" https://<site>/api/login; done` shows 303 and then 429. Warn that a sign-in is blocked for about a minute afterwards.

If a check fails, report what the response was and go back to phase 3; do not weaken the gate.

## Phase 5: Danach

- **5.1** Fill `deck/` (use the `slides` skill) and `site/docs/` (plain Markdown, German and English). Commit and push; Netlify deploys on its own.
- During the training: share the user name and password out of band (calendar entry, start of the training), not in the repo.
- **5.2** After the training: set a new `SITE_PASSWORD` in Netlify and redeploy. A new password ends every open session; so does a new `SESSION_SECRET`. A deploy always ends all sessions, so do not deploy in the middle of an exercise.
- Keeping the sign-in code current: `npm update @miragon/hub-template && npm run hub:sync`. CI (`hub:check`) fails when `netlify/lib/hub/` was edited by hand or is stale.

## Definition of done

Show the final checklist. The hub is ready when 1.1 to 4.5 are `[x]`: the site asks for the sign-in, the sign-in works, the Slides page shows the deck, the redirect and the rate limit hold. 5.1 and 5.2 stay open on purpose, say which of them is still ahead.

## Things that are easy to get wrong

- Editing anything in `netlify/lib/hub/`: it is managed and overwritten by `hub:sync`. Change `hub.config.mjs` or the wrappers in `netlify/functions/` instead.
- Opening `/.netlify/functions/login` as a way around the rate limit: the gate keeps it closed, do not add it to the open paths.
- Putting the deck at `/slides/`: the hub page `slides` lives there. The deck is served at `/deck/`.
- Roles (a trainer who releases solutions) are not part of the template. The BPM training has them; a plain hub has one credential pair.
- The sign-in pages in `site/docs/public/login/` are generated and git-ignored: change the texts in `@miragon/hub-template`, not in the output.
