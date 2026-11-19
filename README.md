# Miragon brand toolbox

[![License: MIT](https://img.shields.io/github/license/Miragon/brand-toolbox)](LICENSE)
[![CI](https://github.com/Miragon/brand-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/Miragon/brand-toolbox/actions/workflows/ci.yml)

Everything other Miragon repositories install from the Miragon brand: one kit per concern, each with its own npm packages, a reference project and, where it helps, a Claude Code plugin. A repository installs what it needs and keeps no copy.

| Kit | What you get | Start here |
|---|---|---|
| [Slidev](kits/slidev/) | Miragon-branded presentations: the theme `@miragon/slidev-toolkit`, the scaffolder `@miragon/create-slidev-deck`, the guardrail linter `@miragon/slidev-validator`, per-speaker slide selections `@miragon/slidev-speaker-profiles`, and the `miragon-slidev` Claude Code plugin. | `npm create @miragon/slidev-deck@latest my-talk` |
| [Docs](kits/docs/) | Miragon-branded VitePress docs sites: `@miragon/docs-starter` gives a tool's `docs/` the Miragon config and theme in one call. | `npm install --save-dev --save-exact @miragon/docs-starter` |
| [Hub](kits/hub/packages/hub-template/) | A training hub: a VitePress site with a sign-in gate around the decks of a training (`@miragon/hub-template`). | `npm create @miragon/slidev-deck@latest my-training -- --hub` |

![Cover slide of the reference deck](.github/assets/cover.png)

## Repository layout

```
kits/<kit>/packages/   the npm packages of a kit, each released on its own
kits/slidev/deck/      the reference deck, the demo and the deck every new one starts from
kits/slidev/plugin/    the miragon-slidev Claude Code plugin
kits/docs/example/     a consumer docs/ folder built with @miragon/docs-starter
kits/docs/templates/   files a docs repo copies: config, landing page, Pages workflow
shared/                brand tokens synced from corporate-identity, scripts every kit uses
```

Working on a kit, or adding one? See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT: see [LICENSE](LICENSE). Each npm package ships its own copy. The bundled Geist fonts are OFL ([`LICENSE.txt`](kits/slidev/packages/toolkit/assets/fonts/LICENSE.txt)).
