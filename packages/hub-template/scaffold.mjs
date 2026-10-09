// Writes the training hub into a repo: the Netlify wrappers, hub.config.mjs, the
// build scripts, a placeholder VitePress site and the checklist of what is still
// to do in Netlify. Used by `npm create @miragon/slidev-deck -- --hub`; exported
// so it can be tested and reused.
//
// The managed sign-in code (netlify/lib/hub/) is copied in by sync(), not
// written here, so scaffolding and `hub-template sync` can never disagree.

import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sync } from "./bin/hub-template.mjs";
import { resolveConfig } from "./lib/hub/config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(HERE, "templates");

export const HUB_SCRIPTS = {
    build: "npm run build:site",
    'build:deck': "slidev build deck/slides.md --out ../dist",
    "build:slides": "node scripts/build-slides.mjs",
    "build:login": "node scripts/build-login-pages.mjs",
    "build:site": "npm run build:slides && npm run build --workspace site",
    "dev:site": "npm run build:login && npm run dev:app --workspace site",
    "hub:sync": "hub-template sync",
    "hub:check": "hub-template check",
};

const PAGES = {
    de: {
        nav: ["Start", "Setup", "Agenda", "Übungen", "Folien", "Ressourcen"],
        lang: "de-DE",
        label: "Deutsch",
        index: (t) => `# ${t}\n\nWillkommen. Hier liegen Setup, Agenda, Übungen, Folien und Ressourcen für das Training.\n\n- [Setup](/setup)\n- [Agenda](/agenda)\n- [Übungen](/exercises)\n- [Folien](/slides)\n- [Ressourcen](/resources)\n`,
        pages: {
            setup: ["Setup", "Was Teilnehmende vor dem Training installieren und einrichten müssen."],
            agenda: ["Agenda", "Der Ablauf des Trainings."],
            exercises: ["Übungen", "Die Aufgaben des Trainings."],
            resources: ["Ressourcen", "Downloads und weiterführende Links."],
        },
        slides: "Die Präsentation öffnet im Vollbild in einem neuen Tab.\n\n[Folien öffnen](/slides/){target=\"_blank\"}",
    },
    en: {
        nav: ["Start", "Setup", "Agenda", "Exercises", "Slides", "Resources"],
        lang: "en-US",
        label: "English",
        index: (t) => `# ${t}\n\nWelcome. Setup, agenda, exercises, slides and resources for the training live here.\n\n- [Setup](/en/setup)\n- [Agenda](/en/agenda)\n- [Exercises](/en/exercises)\n- [Slides](/en/slides)\n- [Resources](/en/resources)\n`,
        pages: {
            setup: ["Setup", "What participants have to install and set up before the training."],
            agenda: ["Agenda", "The schedule of the training."],
            exercises: ["Exercises", "The tasks of the training."],
            resources: ["Resources", "Downloads and further links."],
        },
        slides: "The presentation opens fullscreen in a new tab.\n\n[Open the slides](/slides/){target=\"_blank\"}",
    },
};

const PAGE_ORDER = ["setup", "agenda", "exercises", "slides", "resources"];

function vitepressConfig(config) {
    const locales = { [config.locale]: PAGES[config.locale], [config.other]: PAGES[config.other] };
    const entry = (code, isRoot) => {
        const p = locales[code];
        const prefix = isRoot ? "" : `/${code}`;
        const items = [
            { text: p.nav[0], link: `${prefix}/` },
            ...PAGE_ORDER.map((page, i) => ({ text: p.nav[i + 1], link: `${prefix}/${page}` })),
        ];
        return {
            label: p.label,
            lang: p.lang,
            ...(isRoot ? {} : { link: `/${code}/` }),
            themeConfig: { nav: items, sidebar: items },
        };
    };
    return `import { defineConfig } from "vitepress";
import hub from "../../../hub.config.mjs";

// The training hub. Titles and languages come from hub.config.mjs; the pages
// are plain Markdown under site/docs/ (root language) and site/docs/${config.other}/.
export default defineConfig({
    base: "/",
    lang: ${JSON.stringify(PAGES[config.locale].lang)},
    title: hub.title,
    head: [["link", { rel: "icon", type: "image/svg+xml", href: "/komet.svg" }]],
    cleanUrls: true,
    vite: { server: { allowedHosts: [".localhost"] } },
    // /slides/ is the Slidev deck, built into public/ by scripts/build-slides.mjs.
    ignoreDeadLinks: [/^\\/slides\\//, /^https?:\\/\\/localhost/],
    themeConfig: {
        logo: "/komet.svg",
        siteTitle: hub.title,
        search: { provider: "local" },
    },
    locales: {
        root: ${JSON.stringify(entry(config.locale, true), null, 8).replace(/\n/g, "\n    ")},
        ${config.other}: ${JSON.stringify(entry(config.other, false), null, 8).replace(/\n/g, "\n    ")},
    },
});
`;
}

const CUSTOM_CSS = `/* Brand accent for the hub. Replace with the full Miragon look if you want it. */
:root {
  --vp-c-brand-1: #2b50d4;
  --vp-c-brand-2: #335de5;
  --vp-c-brand-3: #335de5;
  --vp-c-brand-soft: rgba(51, 93, 229, 0.14);
}
`;

const THEME_INDEX = `import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default DefaultTheme;
`;

function netlifyToml() {
    return `# Netlify deployment configuration.
#
# \`npm run build\` builds the Slidev deck into site/docs/public/slides and then
# the VitePress hub, and publishes the hub. The whole site is gated by
# netlify/edge-functions/auth.js: set SITE_PASSWORD and SESSION_SECRET in
# Netlify (see NETLIFY.md). Without SITE_PASSWORD the site is public; with it but
# without SESSION_SECRET the site answers 503 on purpose.

[build]
  command = "npm run build"
  publish = "site/docs/.vitepress/dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[build.environment]
  # The deck's dev tooling (portless) needs Node >= 24.
  NODE_VERSION = "24"

# The functions answer under a readable /api/... path. Must come before the
# site-wide fallback, or the SPA rule below would swallow every API call.
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# Deep-link fallback for the embedded Slidev deck: a reload at slide 7 must serve
# the deck's index.html, not the site's.
[[redirects]]
  from = "/slides/*"
  to = "/slides/index.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
}

function netlifyMd(config) {
    return `# Netlify setup for ${config.title}

The hub is gated by a sign-in page. These are the steps that cannot be scaffolded.
Do them once, in this order.

## 1. Create the site

Netlify → Add new project → Import from Git → pick this repository. The build
settings come from \`netlify.toml\`. Do **not** deploy yet.

## 2. Environment variables

Site configuration → Environment variables → Add a variable:

| Variable | Value | Required |
|---|---|---|
| \`SITE_PASSWORD\` | A password of your choice, shared with participants | yes, otherwise the site is public |
| \`SESSION_SECRET\` | A long random value, generate it with \`openssl rand -base64 48\` | **yes, as soon as \`SITE_PASSWORD\` is set** |
| \`SITE_USER\` | User name, default \`${config.siteUser}\` | no |

For both secrets tick **Contains secret values**. Netlify then switches the scope
to "Specific scopes": keep **Builds**, **Functions** and **Runtime** ticked.

Without \`SESSION_SECRET\` the site refuses to start sessions: the sign-in answers
500 and every page 503. That is on purpose, a signing key made of the credentials
alone could be cracked offline from a participant's own cookie.

## 3. Deploy and test

Deploy, then in a private window:

1. Open the site. You land on \`/login\`, not on a 503 page.
2. Sign in with the user and password. The start page opens.
3. Open \`/login/?to=/%5Cevil.com\` and sign in. You must land on the start page, not on evil.com.
4. Fail more than 10 sign-ins within a minute. The next one is answered with 429.

## 4. Keeping the sign-in code current

The shared sign-in code lives in \`netlify/lib/hub/\` and is managed by
\`@miragon/hub-template\`. Do not edit it by hand: \`npm run hub:sync\` updates it
(after \`npm update @miragon/hub-template\`), and CI fails when it differs
(\`npm run hub:check\`).

## 5. After the training

Rotate \`SITE_PASSWORD\` and redeploy. Changing the password ends every open session.
A new \`SESSION_SECRET\` does the same.
`;
}

const HUB_CI = `name: hub

# The hub's own checks: the managed sign-in code is unmodified, and the hub builds.
on:
  pull_request:
  push:
    branches: [main]

env:
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1"

jobs:
  hub:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - name: The managed sign-in code is up to date and unedited
        run: npm run hub:check
      - name: Build the hub (deck + site)
        run: npm run build
`;

/**
 * Write the hub into \`target\`.
 * @param {string} target repo root
 * @param {{slug: string, title: string, locale?: string}} raw hub config
 * @returns {Promise<{config: object, written: string[]}>}
 */
export async function writeHub(target, raw) {
    const config = resolveConfig(raw);
    const written = [];
    const put = async (rel, content) => {
        const file = join(target, rel);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, content);
        written.push(rel);
    };
    const copy = async (from, rel) => put(rel, await readFile(join(TEMPLATES, from), "utf8"));

    await put(
        "hub.config.mjs",
        `// The settings of this training hub. Read by the Netlify functions, the edge gate
// and the build scripts. See @miragon/hub-template for what each field does.
export default ${JSON.stringify({ slug: config.slug, title: config.title, locale: config.locale, siteUser: config.siteUser }, null, 4)};
`,
    );
    await copy("netlify/functions-login.mjs", "netlify/functions/login.mjs");
    await copy("netlify/functions-logout.mjs", "netlify/functions/logout.mjs");
    await copy("netlify/edge-auth.js", "netlify/edge-functions/auth.js");
    await sync(join(target, "netlify", "lib", "hub"));
    written.push("netlify/lib/hub/");

    await copy("scripts/build-login-pages.mjs", "scripts/build-login-pages.mjs");
    await copy("scripts/build-slides.mjs", "scripts/build-slides.mjs");
    await put("netlify.toml", netlifyToml());
    await put("NETLIFY.md", netlifyMd(config));
    await put(".github/workflows/hub.yml", HUB_CI);

    await put(
        "site/package.json",
        JSON.stringify(
            {
                name: `${config.slug}-site`,
                version: "0.1.0",
                private: true,
                type: "module",
                scripts: {
                    "dev:app": "vitepress dev docs --port ${PORT:-5173} --host 127.0.0.1 --strictPort",
                    build: "node ../scripts/build-login-pages.mjs && vitepress build docs",
                    preview: "vitepress preview docs",
                },
                devDependencies: { vitepress: "1.6.4", vue: "3.5.43" },
            },
            null,
            2,
        ) + "\n",
    );
    await put("site/docs/.vitepress/config.mts", vitepressConfig(config));
    await put("site/docs/.vitepress/theme/index.ts", THEME_INDEX);
    await put("site/docs/.vitepress/theme/custom.css", CUSTOM_CSS);
    await mkdir(join(target, "site/docs/public"), { recursive: true });
    await cp(join(TEMPLATES, "komet.svg"), join(target, "site/docs/public/komet.svg"));
    written.push("site/docs/public/komet.svg");

    for (const code of [config.locale, config.other]) {
        const p = PAGES[code];
        const dir = code === config.locale ? "site/docs" : `site/docs/${code}`;
        await put(`${dir}/index.md`, p.index(config.title));
        for (const page of PAGE_ORDER) {
            if (page === "slides") {
                await put(`${dir}/slides.md`, `# ${p.nav[PAGE_ORDER.indexOf("slides") + 1]}\n\n${p.slides}\n`);
            } else {
                const [title, body] = p.pages[page];
                await put(`${dir}/${page}.md`, `# ${title}\n\n${body}\n`);
            }
        }
    }
    return { config, written };
}

/** The "what is still to do" block printed after scaffolding. */
export function nextStepsText(config) {
    return `
Training hub: still to do in Netlify (details in NETLIFY.md)
  1. Netlify → Add new project → import this repository (do not deploy yet)
  2. Environment variables, both with "Contains secret values" ticked:
       SITE_PASSWORD   the password you share with participants
       SESSION_SECRET  openssl rand -base64 48   (REQUIRED: without it the site answers 503)
  3. Deploy, then test the sign-in in a private window (checklist in NETLIFY.md)
  4. Keep the sign-in code current: npm update @miragon/hub-template && npm run hub:sync`;
}
