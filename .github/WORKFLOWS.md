# .github — CI, release and supply-chain automation

The workflows that keep the template building, releasing and secure. All actions are pinned to a commit SHA; workflows run at least privilege (`contents: read` unless they need more).

## Workflows

| File | Name | Trigger | Does |
|---|---|---|---|
| `build-and-deploy.yml` | Build Deck | push to `main`, every PR, manual | `npm ci`, `slidev build`, then `npm run verify:source`. No browser involved: the PDF export is kept out of `build` and the guardrails are source-only. This is the required CI status; forks inherit it. |
| `release-please.yml` | Release | push to `main`, manual | **Template-only.** Maintains a release PR per package from conventional commits; on merge, cuts the tag/GitHub release and publishes `@miragon/slidev-toolkit` and `@miragon/create-slidev-deck` to npm. |
| `pin-check.yml` | Pin Check | push to `main`, every PR, manual | Fails if any `package.json` reintroduces a version range, wildcard, dist-tag or mutable git ref ([`Miragon/pin-npm-dependencies`](https://github.com/Miragon/pin-npm-dependencies)). |
| `pr-title.yml` | PR Title | PR opened / edited | **Template-only.** Validates the PR title as a conventional-commit subject (`feat:`, `fix:`, `chore:`, …) so squash-merges give release-please a clean history. |

## Template-only workflows

"Use this template" copies every file here into the new repo, but only this repo owns the npm package. **Release** and **PR Title** are therefore guarded per job with `github.repository == 'Miragon/slidev-deck-template'`:

- Without the guard, a derived repo in the Miragon org would inherit the **org-level** release-please App credentials, open its own release PRs, and then fail the publish on an OIDC claim mismatch. Its PR titles would also be held to conventional-commit rules for no reason.
- In a derived repo both workflows now run as *skipped* — visible in the Actions tab, but with no effect (a skipped job counts as passing, so it never blocks a merge).
- The repo slug is repeated literally in each `if:` on purpose: the `env` context is not available in `jobs.<id>.if`. **Renaming or moving this repo means updating all five occurrences** (four jobs in `release-please.yml` plus `pr-title.yml`), otherwise releases stop silently.

Build Deck and Pin Check are deliberately *not* guarded — every deck repo wants them.

## npm publishing (Trusted Publishing / OIDC)

`release-please.yml` publishes without an `NPM_TOKEN` secret. npm validates an OIDC token against the trusted-publisher config on npmjs.com, so the setup is deliberately constrained — read the header comment in the file before touching it:

- Each package has its own publish job (`publish-toolkit`, `publish-create-deck`) gated on that package's own release, running **inline** in `release-please.yml` (the trusted-publisher config keys on the workflow filename).
- **No GitHub environment** on the publish jobs (the environment-name claim must stay empty).
- Publishing is **idempotent** — a job skips if that package's current version is already on npm.
- `workflow_dispatch` inputs allow a dry-run (both packages) or a manual `publish_current` recovery republish.

## Dependency updates

`dependabot.yml` opens grouped update PRs; each is gated by Build Deck + Pin Check before merge. Because updates land as PRs, Pin Check keeps their titles and version pins honest.

## Deployment

Hosting is Netlify (`netlify.toml` in the repo root), not a workflow here — it runs `npm run build` on its own builders (no Chromium: the PDF export is deliberately kept out of `build`). Deployment is opt-in even so: a `netlify.toml` creates no site by itself, Netlify builds only a repo that someone links to a site in its UI, so a repo created from this template gets no site and no URL. The `--base /<repo>/` in Build Deck keeps the build compatible with a GitHub Pages base path if you wire up a Pages deploy later.
