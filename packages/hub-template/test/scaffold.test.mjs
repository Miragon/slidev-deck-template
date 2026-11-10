import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { check } from "../bin/hub-template.mjs";
import { HUB_INITIAL_VERSION, nextStepsText, writeHub } from "../scaffold.mjs";

test("the hub scaffold writes a complete, consistent hub", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hub-scaffold-"));
    const { config, written } = await writeHub(dir, { slug: "demo-training", title: "Demo Training", locale: "de" });
    assert.equal(config.cookieName, "demo_training_session");

    for (const rel of [
        "hub.config.mjs",
        "netlify.toml",
        "NETLIFY.md",
        "netlify/functions/login.mjs",
        "netlify/functions/logout.mjs",
        "netlify/edge-functions/auth.js",
        "netlify/lib/hub/session.mjs",
        "scripts/build-login-pages.mjs",
        "scripts/build-slides.mjs",
        "site/package.json",
        "site/docs/.vitepress/config.mts",
        "site/docs/index.md",
        "site/docs/en/index.md",
        "site/docs/slides.md",
        "site/docs/en/slides.md",
        "site/docs/public/komet.svg",
        ".github/workflows/hub.yml",
        ".github/workflows/release-please.yml",
        ".github/workflows/pr-title.yml",
        "release-please-config.json",
        ".release-please-manifest.json",
    ]) {
        assert.ok(existsSync(join(dir, rel)), rel);
    }
    assert.ok(written.includes("hub.config.mjs"));
    assert.deepEqual(await check(join(dir, "netlify/lib/hub")), { ok: true });

    // The login wrapper carries the static config Netlify reads, incl. the rate limit.
    const login = await readFile(join(dir, "netlify/functions/login.mjs"), "utf8");
    assert.match(login, /path: "\/api\/login"/);
    assert.match(login, /windowLimit: 10/);

    // The generated hub.config.mjs and the wrappers load and agree.
    const hub = (await import(join(dir, "hub.config.mjs"))).default;
    assert.equal(hub.slug, "demo-training");
    const { createLogin } = await import(join(dir, "netlify/lib/hub/login.mjs"));
    const res = await createLogin(hub, (k) => ({ SITE_PASSWORD: "p", SESSION_SECRET: "s" })[k])(
        new Request("https://x.test/api/login", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "user=training&password=p&to=/a&lang=de",
        }),
    );
    assert.equal(res.status, 303);
    assert.match(res.headers.get("set-cookie"), /^demo_training_session=/);

    // The checklist names what the user must do in Netlify.
    assert.match(nextStepsText(config), /SESSION_SECRET/);
    assert.match(nextStepsText(config), /NETLIFY_SITE_ID/);
});

test("production only changes on a release", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hub-release-"));
    await writeHub(dir, { slug: "demo-training", title: "Demo Training", locale: "de" });
    const read = (rel) => readFile(join(dir, rel), "utf8");

    const releaseConfig = JSON.parse(await read("release-please-config.json"));
    assert.equal(releaseConfig["release-type"], "node");
    assert.equal(releaseConfig.packages["."]["package-name"], "demo-training");
    assert.deepEqual(JSON.parse(await read(".release-please-manifest.json")), { ".": HUB_INITIAL_VERSION });

    assert.match(await read("netlify.toml"), /\[context\.production\]\s+ignore = "exit 0"/);

    const workflow = await read(".github/workflows/release-please.yml");
    assert.match(workflow, /if: needs\.release-please\.outputs\.release_created == 'true'/);
    assert.match(workflow, /netlify-cli@\d+\.\d+\.\d+ deploy --no-build --prod/);
    assert.match(workflow, /NETLIFY_SITE_ID: \$\{\{ vars\.NETLIFY_SITE_ID \}\}/);
    for (const staged of ["netlify", "netlify.toml", "hub.config.mjs", "site/docs/.vitepress/dist"]) {
        assert.ok(workflow.includes(staged), `the deploy copy is missing ${staged}`);
    }

    assert.match(await read("NETLIFY.md"), /Production only on release/);
});

test("the staged deploy copy carries everything the functions import", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hub-stage-"));
    await writeHub(dir, { slug: "demo-training", title: "Demo Training", locale: "de" });
    const workflow = await readFile(join(dir, ".github/workflows/release-please.yml"), "utf8");
    const stageScript = workflow
        .split("\n")
        .filter((line) => /^\s+(mkdir|cp) /.test(line))
        .map((line) => line.trim())
        .join("\n");
    const stage = await mkdtemp(join(tmpdir(), "hub-stage-out-"));
    await mkdir(join(dir, "site/docs/.vitepress/dist"), { recursive: true });
    execFileSync("bash", ["-euc", stageScript], { cwd: dir, env: { ...process.env, HUB_STAGE: stage } });

    const { default: login } = await import(join(stage, "netlify/functions/login.mjs"));
    const { default: gate } = await import(join(stage, "netlify/edge-functions/auth.js"));
    assert.equal(typeof login, "function");
    assert.equal(typeof gate, "function");
    assert.ok(existsSync(join(stage, "netlify.toml")));
    assert.ok(existsSync(join(stage, "site/docs/.vitepress/dist")));
});

test("an English root puts German under /de/", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hub-scaffold-en-"));
    await writeHub(dir, { slug: "x", title: "X", locale: "en" });
    assert.ok(existsSync(join(dir, "site/docs/de/index.md")));
    assert.ok(!existsSync(join(dir, "site/docs/en")));
    assert.match(await readFile(join(dir, "site/docs/.vitepress/config.mts"), "utf8"), /\/de\//);
});
