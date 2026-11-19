# @miragon/docs-starter

The Miragon docs kit for [VitePress](https://vitepress.dev): one call gives a docs site the Miragon look, light and dark, with GitHub anchors, Mermaid in the brand colours, local search, a GitHub star button and the legal row on every page. A docs repo installs it and keeps no copy.

## Install

In the repo's `docs/` folder (its own npm project):

```bash
npm install --save-dev --save-exact @miragon/docs-starter
```

Start `docs/package.json` from [`kits/docs/example/package.json`](https://github.com/Miragon/brand-toolbox/blob/main/kits/docs/example/package.json): it pins VitePress, Mermaid and the helpers Mermaid needs, and carries the two `overrides` (`vite` 6.4.5, `vitepress-plugin-mermaid` → your `mermaid`). npm honours `overrides` only in the root manifest of the install, so they live there, not in this package.

## Use

`docs/.vitepress/config.ts`:

```ts
import { miragonDocs } from "@miragon/docs-starter"

export default miragonDocs({
  repo: "Miragon/<repo>",
  title: "Miragon <Tool>",
  description: "<One sentence: what the tool does and for whom.>",
  productPage: "https://miragon.ai/tools/<tool>/",
  nav: [{ text: "Getting started", link: "/getting-started" }],
  sidebar: [{ text: "Start", items: [{ text: "Getting started", link: "/getting-started" }] }],
})
```

`docs/.vitepress/theme/index.ts`:

```ts
export { default } from "@miragon/docs-starter/theme"
```

Build with `DOCS_BASE=/<repo>/ npx vitepress build` for GitHub Pages; the kit sets VitePress' `base` from it. Templates for the landing page, the Pages workflow and `brand.json` are in [`kits/docs/templates/`](https://github.com/Miragon/brand-toolbox/tree/main/kits/docs/templates). Coming from a copy in `docs/.vitepress/miragon/`? See [MIGRATION.md](https://github.com/Miragon/brand-toolbox/blob/main/kits/docs/MIGRATION.md).

## Options

All options of `miragonDocs()` are typed and documented in [`src/config.ts`](https://github.com/Miragon/brand-toolbox/blob/main/kits/docs/packages/docs-starter/src/config.ts) (`MiragonDocsOptions`): `lang` (`en-US` or `de-DE`), `siteTitle`, `githubStars`, `starPrompt`, `socialLinks`, `branch`, `docsDir`, `footerMessage`, and pass-throughs for `head`, `markdown`, `vite`, `mermaid`, `srcExclude`, `rewrites`, `ignoreDeadLinks`, `sitemap`.

## License

MIT for the code. The Miragon name, logo and comet are trademarks of Miragon GmbH and not covered by it; see [LICENSE](LICENSE).
