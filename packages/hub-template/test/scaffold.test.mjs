import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { check } from "../bin/hub-template.mjs";
import { nextStepsText, writeHub } from "../scaffold.mjs";

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
});

test("an English root puts German under /de/", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hub-scaffold-en-"));
    await writeHub(dir, { slug: "x", title: "X", locale: "en" });
    assert.ok(existsSync(join(dir, "site/docs/de/index.md")));
    assert.ok(!existsSync(join(dir, "site/docs/en")));
    assert.match(await readFile(join(dir, "site/docs/.vitepress/config.mts"), "utf8"), /\/de\//);
});
