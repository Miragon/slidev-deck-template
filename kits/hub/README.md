# Miragon training hub

[![npm](https://img.shields.io/npm/v/@miragon/hub-template?label=hub-template)](https://www.npmjs.com/package/@miragon/hub-template)
[![CI](https://github.com/Miragon/brand-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/Miragon/brand-toolbox/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/Miragon/brand-toolbox)](../../LICENSE)

**One site per training: participants sign in once and find everything in one place.**

A Netlify site with a sign-in page around your setup guide, agenda, exercises, resources and Slidev deck.

## Why

Training material usually reaches participants as emails, PDFs and a link to the slides, and half of it is lost by day two. Every training now starts from the same tested sign-in instead of building its own.

## What you get

- **One password for everything.** Every page and the slides sit behind a shared user name and password; changing the password signs everyone out.
- **Your deck inside the site.** The deck from the same repo appears on the site's Slides page.
- **German and English.** `--locale` picks the language of the start page; the other language gets its own pages next to it.
- **Live only when you release.** After your pushes, a bot opens a release pull request; merging it publishes the site.

The hub has no roles, such as a trainer who unlocks solutions.

## Get started

You need npm and Node.js 24 or newer on macOS or Linux, the repo in the Miragon GitHub organisation, and access to Miragon's Netlify team.

```bash
npm create @miragon/slidev-deck@latest my-training -- --hub --title "My Training" --locale de
cd my-training
npm install
npm run dev:site
```

Write your pages in `site/docs/` (the other language in its subfolder, `site/docs/en/` here) and your slides in `deck/`; `npm run dev` shows the deck alone. Before the site goes live, connect the repo to Netlify and set the password: `NETLIFY.md` in your new repo walks you through both. Then send participants the site address, the user name and the password.

## With your AI assistant

The `create-training-hub` skill of the `miragon-slidev` Claude Code plugin walks you through setting up and running a training. Your new repo offers the plugin once you trust its folder in Claude Code; then ask it to set up a new training.

## Help and feedback

- **Setup details and what the sign-in guarantees:** [@miragon/hub-template](packages/hub-template/README.md).
- **Bugs and ideas:** [open an issue](https://github.com/Miragon/brand-toolbox/issues).

## Contributing

To build or change the hub, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

[MIT](../../LICENSE) © Miragon GmbH.
