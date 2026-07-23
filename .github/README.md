# .github — CI, release and supply-chain automation

The workflows that keep the template building, releasing and secure. All actions are pinned to a commit SHA; workflows run at least privilege (`contents: read` unless they need more).

## Workflows

| File | Name | Trigger | Does |
|---|---|---|---|
| `build-and-deploy.yml` | Build Deck | push to `main`, every PR, manual | `npm ci`, install Chromium, `slidev build` (with the PDF for the download button), then `npm run verify:source`. This is the required CI status; forks inherit it. |
| `release-please.yml` | Release | push to `main`, manual | Maintains a release PR from conventional commits; on merge, cuts the tag/GitHub release and publishes `@miragon/slidev-toolkit` to npm. |
| `pin-check.yml` | Pin Check | push to `main`, every PR, manual | Fails if any `package.json` reintroduces a version range, wildcard, dist-tag or mutable git ref ([`Miragon/pin-npm-dependencies`](https://github.com/Miragon/pin-npm-dependencies)). |
| `pr-title.yml` | PR Title | PR opened / edited | Validates the PR title as a conventional-commit subject (`feat:`, `fix:`, `chore:`, …) so squash-merges give release-please a clean history. |

## npm publishing (Trusted Publishing / OIDC)

`release-please.yml` publishes without an `NPM_TOKEN` secret. npm validates an OIDC token against the trusted-publisher config on npmjs.com, so the setup is deliberately constrained — read the header comment in the file before touching it:

- The publish job runs **inline** in `release-please.yml` (the trusted-publisher config keys on the workflow filename).
- **No GitHub environment** on the publish job (the environment-name claim must stay empty).
- Publishing is **idempotent** — it skips if the current `packages/toolkit` version is already on npm.
- `workflow_dispatch` inputs allow a dry-run or a manual `publish_current` recovery republish.

## Dependency updates

`dependabot.yml` opens grouped update PRs; each is gated by Build Deck + Pin Check before merge. Because updates land as PRs, Pin Check keeps their titles and version pins honest.

## Deployment

Hosting is Netlify (`netlify.toml` in the repo root), not a workflow here — it installs Chromium and runs `npm run build` on its own builders. The `--base /<repo>/` in Build Deck keeps the build compatible with a GitHub Pages base path if you wire up a Pages deploy later.
