# Migration: `@miragon/slidev-toolkit` 2.0, the `code` layout became `window`

Toolkit 2.0 renames the `code` layout to `window`, because its tabs hold diagrams as
often as code, and gathers every per-tab setting into one `tabs:` list. Each tab can
now carry its own caption. `files:`, `icons:`, `tabIcon:` and the slide-wide `lang:`
are gone. Pair it with `@miragon/slidev-validator` from the same release: its
`window-tabs` rule names every slide that still uses the old layout or keys.

Before:

```yaml
layout: code
files:
  - recruitment.bpmn
  - SendOfferWorker.kt
icons:
  - i-lucide-workflow
lang: kotlin
```

After:

```yaml
layout: window
tabs:
  - label: recruitment.bpmn
    icon: i-lucide-workflow
    caption: "**The process:** an offer goes out once the rule says yes."
  - label: SendOfferWorker.kt
    lang: kotlin
```

1. Set `layout: window` on every former `code` slide.
2. Turn each `files` entry into a `tabs` entry with that `label`.
3. Move `icons[i]` to `tabs[i].icon`. A former `tabIcon` goes on every entry
   (`icon: false` for no icon).
4. Move `lang` to the entries whose tab it describes, usually only the code tabs.
5. Optional: give a tab its own `caption`. `::caption::` stays and shows for every
   tab without one.
6. `npm run verify:source` until `window-tabs` is green.

---

# Migration: from the copied `verify/` suite to `@miragon/slidev-validator`

Older decks (scaffolded before this change) carry a **static copy** of the
guardrail suite in a top-level `verify/` folder, driven by Playwright. That copy
is frozen: central rule improvements never reach it. The guardrails now ship as the
versioned **`@miragon/slidev-validator`** package, consumed as an exact-pinned
dependency, so improvements arrive over a controlled `npm update`.

## Automatic path

From the deck root:

```bash
npx @miragon/slidev-validator@latest migrate
```

This will:

1. Write a starter `slidev-validator.config.mjs` (extends `recommended`) if absent.
2. Rewrite the `verify` / `verify:source` / `verify:ci` scripts to call
   `slidev-validator`.
3. Remove the now-redundant `@playwright/test` / `playwright-chromium`
   devDependencies (the validator brings `playwright-chromium` transitively).
4. Print a reminder to add the validator dependency and delete the old folder.

Then finish by hand:

```bash
npm install --save-dev --save-exact @miragon/slidev-validator
git rm -r verify           # the copied suite is superseded
npm install
npm run verify:source      # confirm green
```

## What changes for you

- **Config, not code.** Tune or scope rules in `slidev-validator.config.mjs`
  (`extends` / `rules` / `overrides` / `exceptions`) instead of editing copied
  rule files. See [packages/validator/README.md](packages/validator/README.md).
- **Stable rule ids + severities.** Every check has an id and an `off`/`warn`/
  `error` severity. Required rules cannot be silently disabled — suppress them via
  a reported `exceptions` entry.
- **Updates are controlled.** Bump the pinned validator version deliberately. A
  minor may add a `warn` rule; a major may add a rule that newly fails your deck —
  the changelog says which. Roll back with
  `npm install @miragon/slidev-validator@<previous>`.
- **CI.** `.github/workflows/ci.yml` already runs `npm run verify:source`; no
  change needed once the scripts point at the validator.

## If a new version newly fails your deck

1. Read the report — it names the rule, the file/slide, and how to fix it. Fix the
   slide first.
2. If a specific slide legitimately needs an exemption, add a scoped
   `overrides` entry (recommended rules) or an `exceptions` entry with a `reason`
   (any rule, including required) — both stay visible in the report and CI.
3. To defer entirely, pin the previous validator version until you can address it.
