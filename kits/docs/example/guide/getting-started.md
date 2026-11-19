# Getting started

This page shows what a tool's docs page looks like with the kit. Jump to [Changes from 0.6](#changes-from-06), [Über uns](#über-uns) or the [second Setup](#setup-1).

## Install

```bash
npm install --save-dev vitepress@1.6.4
npx vitepress dev docs
```

Inline code such as `miragonDocs()` sits on the section colour. A [link to the diagrams](./diagrams.md) is blue in light mode and green in dark mode.

## Changes from 0.6

GitHub turns this heading into `changes-from-06`, VitePress alone into `changes-from-0-6`.

### Über uns

Umlauts stay in the anchor: `über-uns`.

### C++ & C#

Punctuation goes, spaces turn into hyphens: `c--c`.

## Step 1: Install the `miragonDocs` helper

| Option | Default | What it does |
|---|---|---|
| `lang` | `en-US` | Language of the site and the fixed texts |
| `productPage` | none | Adds the miragon.ai link to the nav |

## Setup

The first heading named Setup.

## Setup

The second one gets `setup-1`, as on GitHub.

## Notes

::: info
A neutral note on the section colour.
:::

::: tip
A tip in the colour of the hints, with `code` and a [link](#install).
:::

::: warning
A warning: amber border, text in the text colour.
:::

::: danger
Danger: red border, text in the text colour.
:::

::: details Click to open
Hidden details.
:::

> [!NOTE]
> A GitHub alert works too.
