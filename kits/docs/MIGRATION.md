# Migration: from a copied docs kit to `@miragon/docs-starter`

For a repo that has the kit as a copy in `docs/.vitepress/miragon/` (vendored from the `docs-site` skill in Miragon/corporate-identity). `@miragon/docs-starter` 1.0.0 is kit 1.32.0 as a package. A repo on an older kit also takes the changes between its version and 1.32.0.

1. In `docs/`: `npm install --save-dev --save-exact @miragon/docs-starter`. Compare `docs/package.json` with [`example/package.json`](example/package.json) and take its pins and `overrides`; remove `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (the package brings them) and the `check:kit` script.
2. `docs/.vitepress/config.ts`: `import { miragonDocs } from "./miragon/config"` becomes `import { miragonDocs } from "@miragon/docs-starter"`. `miragonLegal` comes from the same import.
3. `docs/.vitepress/theme/index.ts`: `"../miragon/theme"` becomes `"@miragon/docs-starter/theme"`, also where a theme `extends` it.
4. Delete `docs/.vitepress/miragon/` and `docs/public/logo/miragon-komet-blau.svg`. The package serves the favicon under the same URL in dev and copies it into the build.
5. `.github/workflows/docs.yml`: delete the step "Check the Miragon docs kit" (`node .vitepress/miragon/check.mjs`). Compare with [`templates/docs.yml`](templates/docs.yml).
6. `brand.json`: remove `docs/.vitepress/miragon/` from `ignorieren`.
7. Check: `DOCS_BASE=/<repo>/ npm run build` in `docs/` is green, and `npm run dev` shows the comet in the title and the legal row at the bottom.
