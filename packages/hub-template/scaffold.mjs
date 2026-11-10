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

// The deck is built into public/deck/ (scripts/build-slides.mjs); the Slides page
// shows it in place and links to the fullscreen version. It must NOT live at
// /slides/: the hub page slides.md is served at /slides too, and on Netlify that
// name clash serves the hub page instead of the deck.
const slidesBody = (frameTitle, openLabel) =>
    `<iframe class="hub-slides" src="/deck/" title="${frameTitle}" allowfullscreen></iframe>\n\n[${openLabel}](/deck/){target="_blank"}`;

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
        slides: slidesBody("Folien des Trainings", "Im Vollbild öffnen"),
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
        slides: slidesBody("Slides of the training", "Open fullscreen"),
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
    // /deck/ is the Slidev deck, built into public/ by scripts/build-slides.mjs.
    ignoreDeadLinks: [/^\\/deck\\//, /^https?:\\/\\/localhost/],
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

/* The Slides page shows the Slidev deck in place: use the full content width. */
.hub-slides-page .container,
.hub-slides-page .content-container {
  max-width: 100% !important;
}
.hub-slides {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 16px 0;
}
`;

const THEME_INDEX = `import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default DefaultTheme;
`;

function netlifyToml() {
    return `# Netlify deployment configuration.
#
# \`npm run build\` builds the Slidev deck into site/docs/public/deck and then
# the VitePress hub, and publishes the hub. The whole site is gated by
# netlify/edge-functions/auth.js: set SITE_PASSWORD and SESSION_SECRET in
# Netlify (see NETLIFY.md). Without SITE_PASSWORD the site is public; with it but
# without SESSION_SECRET the site answers 503 on purpose.
#
# Production only changes on a release: the release workflow
# (.github/workflows/release-please.yml) builds the release commit and deploys
# it with the Netlify CLI. Netlify's own production builds of main are skipped
# by the ignore command below; every PR still gets a deploy preview.

[build]
  command = "npm run build"
  publish = "site/docs/.vitepress/dist"

[context.production]
  ignore = "exit 0"

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
  from = "/deck/*"
  to = "/deck/index.html"
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
settings come from \`netlify.toml\`. Do **not** deploy yet. If Netlify starts a
production build anyway, it shows up as canceled: production only comes from a
release (section 3).

**Leave Base directory empty.** If it contains anything (Netlify often fills in
\`site\`), delete the content. With a base of \`site\` the build runs in the wrong
folder and fails with "Deploy directory 'site/site/docs/.vitepress/dist' does not
exist". You find it under Site configuration → Build & deploy → Build settings.

## 2. Environment variables

Site configuration → Environment variables → Add a variable:

| Variable | Value | Required |
|---|---|---|
| \`SITE_PASSWORD\` | A password of your choice, shared with participants | yes, otherwise the site is public |
| \`SESSION_SECRET\` | A long random value, generate it with \`openssl rand -base64 48\` | **yes, as soon as \`SITE_PASSWORD\` is set** |
| \`SITE_USER\` | User name, default \`${config.siteUser}\` | no |

The sign-in asks for a user name and a password. Unless you set \`SITE_USER\`, the
user name is \`${config.siteUser}\`; tell the participants.

For both secrets tick **Contains secret values**. Netlify then switches the scope
to "Specific scopes": keep **Builds**, **Functions** and **Runtime** ticked.

A secret cannot be read again after saving. To change it: Environment variables →
the variable → Edit → enter the new value → save, **then deploy again** (section
3); Functions and the edge gate only see the new value after a new deploy.

Without \`SESSION_SECRET\` the site refuses to start sessions: the sign-in answers
500 and every page 503. That is on purpose, a signing key made of the credentials
alone could be cracked offline from a participant's own cookie.

## 3. Production only on release

A push to \`main\` never goes live. Release Please keeps a Release PR open; merging
it creates the tag, and the job \`deploy-hub\` in \`.github/workflows/release-please.yml\`
builds that commit and deploys it to production with the Netlify CLI. Pull
requests still get deploy previews from Netlify.

Once per repository:

1. **Release Please App:** the Miragon Release Please App must have access to this
   repository (GitHub → Miragon → Settings → GitHub Apps → Release Please →
   Repository access).
2. **\`NETLIFY_AUTH_TOKEN\`:** a Netlify personal access token as a GitHub secret. In
   the Miragon organisation it already exists as an organisation secret.
3. **\`NETLIFY_SITE_ID\`:** the Project ID from Project configuration → General, as a
   repository variable: \`gh variable set NETLIFY_SITE_ID --body <project-id>\`.
4. **Netlify branches:** keep the defaults under Project configuration → Build &
   deploy → Branches and deploy contexts: production branch \`main\`, branch deploys
   only for the production branch, deploy previews for any pull request.

Day to day:

- **Deploy again** (after changing a variable): re-run the job \`deploy-hub\` of the
  latest release run in GitHub Actions. "Trigger deploy" in Netlify does not build
  production; \`netlify.toml\` skips it.
- **Roll back:** Netlify → Deploys → the deploy named after the older tag → Publish
  deploy, or re-run \`deploy-hub\` of that release's run.
- A fresh Release PR can fail its deploy preview with "git ref pull/<n>/head does
  not exist": Netlify was faster than GitHub. Retry that deploy in Netlify.

## 4. First release and test

The Release PR opens after the first \`feat:\` or \`fix:\` commit on \`main\`. Merge it
once sections 1 to 3 are done; \`deploy-hub\` deploys the hub. Then in a private
window:

1. Open the site. You land on \`/login\`, not on a 503 page.
2. Sign in with the user (\`${config.siteUser}\` unless \`SITE_USER\` is set) and the password. The start page opens.
3. Open \`/login/?to=/%5Cevil.com\` and sign in. You must land on the start page, not on evil.com.
4. Fail more than 10 sign-ins within a minute. The next one is answered with 429.

## 5. Keeping the sign-in code current

The shared sign-in code lives in \`netlify/lib/hub/\` and is managed by
\`@miragon/hub-template\`. Do not edit it by hand: \`npm run hub:sync\` updates it
(after \`npm update @miragon/hub-template\`), and CI fails when it differs
(\`npm run hub:check\`).

## 6. After the training

Rotate \`SITE_PASSWORD\` and deploy again (section 3). Changing the password ends every open session.
A new \`SESSION_SECRET\` does the same.
`;
}

// The version a new hub starts at. Never released, so the first `feat:` makes 0.1.0.
// create-deck writes it into the root package.json, the manifest below repeats it.
export const HUB_INITIAL_VERSION = "0.0.0";

const NETLIFY_CLI_VERSION = "27.16.3";

const RELEASE_WORKFLOW = `name: Release

# On every push to main, release-please maintains a "Release PR" that bumps the
# version and updates CHANGELOG.md. Merging that Release PR creates the GitHub
# release/tag, and deploy-hub then builds the release commit and deploys it to
# Netlify production with the Netlify CLI. Netlify's own production builds are
# switched off in netlify.toml, so main can carry work in progress; pull
# requests still get deploy previews from the Netlify Git integration.
#
# The GitHub App token (not the default GITHUB_TOKEN) is required so the bot's
# commits and tags trigger downstream workflows.
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: \${{ steps.release_please.outputs.release_created }}
      tag_name: \${{ steps.release_please.outputs.tag_name }}
    steps:
      - uses: actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510 # v3.3.0
        id: app-token
        with:
          client-id: \${{ vars.RELEASE_PLEASE_APP_CLIENT_ID }}
          private-key: \${{ secrets.RELEASE_PLEASE_APP_PRIVATE_KEY }}
      - id: release_please
        uses: googleapis/release-please-action@45996ed1f6d02564a971a2fa1b5860e934307cf7 # v5.0.0
        with:
          token: \${{ steps.app-token.outputs.token }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

  # Re-running this job of an older release run deploys that release again, see
  # "Production only on release" in NETLIFY.md.
  deploy-hub:
    needs: release-please
    if: needs.release-please.outputs.release_created == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    env:
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1"
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      # Inside the repo the CLI sees the npm workspace site/ and deploys from
      # there instead of the root, so the built hub, the functions, the config
      # they import and netlify.toml are deployed from a copy outside of it.
      - name: Deploy \${{ needs.release-please.outputs.tag_name }} to production
        env:
          TAG_NAME: \${{ needs.release-please.outputs.tag_name }}
          HUB_STAGE: \${{ runner.temp }}/hub
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: \${{ vars.NETLIFY_SITE_ID }}
        run: |
          mkdir -p "$HUB_STAGE/site/docs/.vitepress"
          cp -R netlify netlify.toml hub.config.mjs "$HUB_STAGE/"
          cp -R site/docs/.vitepress/dist "$HUB_STAGE/site/docs/.vitepress/"
          cd "$HUB_STAGE"
          npx --yes netlify-cli@${NETLIFY_CLI_VERSION} deploy --no-build --prod --message "$TAG_NAME"
`;

const PR_TITLE_WORKFLOW = `name: PR Title

# release-please parses conventional commits to decide version bumps. Because PRs
# are squash-merged, the PR title becomes the commit message on main, so it must
# be a valid conventional-commit subject (feat:, fix:, chore:, ...).
on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

permissions:
  pull-requests: read

concurrency:
  group: pr-title-\${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  validate-pr-title:
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@48f256284bd46cdaab1048c3721360e808335d50 # v6.1.1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          validateSingleCommit: true
          types: |
            feat
            fix
            chore
            docs
            refactor
            ci
            build
            test
            revert
`;

function releasePleaseConfig(config) {
    const releaseConfig = {
        $schema: "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
        "release-type": "node",
        "bump-minor-pre-major": true,
        "include-component-in-tag": false,
        packages: { ".": { "package-name": config.slug, "changelog-path": "CHANGELOG.md" } },
    };
    return JSON.stringify(releaseConfig, null, 2) + "\n";
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
    await put(".github/workflows/release-please.yml", RELEASE_WORKFLOW);
    await put(".github/workflows/pr-title.yml", PR_TITLE_WORKFLOW);
    await put("release-please-config.json", releasePleaseConfig(config));
    await put(".release-please-manifest.json", JSON.stringify({ ".": HUB_INITIAL_VERSION }, null, 2) + "\n");

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
                await put(
                    `${dir}/slides.md`,
                    `---\npageClass: hub-slides-page\n---\n\n# ${p.nav[PAGE_ORDER.indexOf("slides") + 1]}\n\n${p.slides}\n`,
                );
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
  1. Netlify → Add new project → import this repository (do not deploy yet).
     Leave "Base directory" EMPTY; if it contains anything (often "site"), delete it
  2. Environment variables, both with "Contains secret values" ticked:
       SITE_PASSWORD   the password you share with participants
       SESSION_SECRET  openssl rand -base64 48   (REQUIRED: without it the site answers 503)
  3. Production only on release: give the Release Please App access to the repo,
     set the repo variable NETLIFY_SITE_ID (Project ID); NETLIFY_AUTH_TOKEN is an
     org secret in Miragon
  4. Merge the first Release PR, then test the sign-in in a private window (checklist in NETLIFY.md).
     User name: ${config.siteUser} (unless you set SITE_USER)
  5. Keep the sign-in code current: npm update @miragon/hub-template && npm run hub:sync`;
}
