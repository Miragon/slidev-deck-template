# miragon-slidev (Claude Code plugin)

The Miragon Slidev **authoring capabilities**, packaged as a Claude Code plugin so decks
scaffolded from [`@miragon/slidev-deck-template`](https://github.com/Miragon/slidev-deck-template)
stay up to date automatically instead of carrying a frozen copy of the skills.

## What's inside

| Skill | Invoke as | Purpose |
|---|---|---|
| `slides` | `/miragon-slidev:slides` | Authoring guide for the Miragon-branded deck: layout archetypes, the reusable components, brand colours/typography, editorial rules. |
| `excalidraw` | `/miragon-slidev:excalidraw` | Author and repair Miragon-branded Excalidraw `.excalidraw.svg` diagrams. |

Both skills are also **model-invoked**: Claude selects them automatically from their
`description` when you work under `deck/`, so you rarely type the namespaced command.

## Install

The plugin is served from the marketplace in the template repo (public — no auth):

```
/plugin marketplace add Miragon/slidev-deck-template
/plugin install miragon-slidev@miragon-slidev
```

Decks scaffolded with `npm create @miragon/slidev-deck` register this marketplace in
their `.claude/settings.json` with `autoUpdate` enabled, so opening the deck prompts a
one-time install and later versions arrive in the background.

## Versioning

The plugin version lives in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json)
and is bumped by release-please from `feat(miragon-slidev): …` / `fix(miragon-slidev): …`
commits. Claude Code's background auto-update delivers each published version. See
[CHANGELOG.md](CHANGELOG.md).

## Targeted toolkit range

The guidance targets `@miragon/slidev-toolkit >=1.15.0 <2`. Keep the toolkit current
(Dependabot) so the skills and the rendered theme stay in sync.
