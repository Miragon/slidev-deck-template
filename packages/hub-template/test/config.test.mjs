import assert from "node:assert/strict";
import test from "node:test";

import { langOf, loginPath, resolveConfig, startPath } from "../lib/hub/config.mjs";
import { renderLoginPage } from "../lib/hub/login-page.mjs";

test("defaults and derived values", () => {
    const c = resolveConfig({ slug: "my-training", title: "My Training" });
    assert.equal(c.locale, "de");
    assert.equal(c.other, "en");
    assert.equal(c.siteUser, "training");
    assert.equal(c.cookieName, "my_training_session");
});

test("a bad slug or locale is refused", () => {
    for (const bad of [{}, { slug: "" }, { slug: "Has Space" }, { slug: "-x" }]) {
        assert.throws(() => resolveConfig(bad), /slug/);
    }
    assert.throws(() => resolveConfig({ slug: "x", locale: "fr" }), /locale/);
});

test("paths follow the root language", () => {
    const de = resolveConfig({ slug: "x", locale: "de" });
    assert.equal(loginPath(de, "de"), "/login/");
    assert.equal(loginPath(de, "en"), "/en/login/");
    assert.equal(startPath(de, "en"), "/en/");
    const en = resolveConfig({ slug: "x", locale: "en" });
    assert.equal(loginPath(en, "en"), "/login/");
    assert.equal(loginPath(en, "de"), "/de/login/");
    assert.equal(langOf(en, "de"), "de");
    assert.equal(langOf(en, "nonsense"), "en");
});

test("the sign-in page carries the title, the language and the twin link", () => {
    const html = renderLoginPage({ slug: "x", title: "A & B", locale: "en" }, "de");
    assert.match(html, /<html lang="de">/);
    assert.match(html, /A &amp; B/);
    assert.match(html, /action="\/api\/login"/);
    assert.match(html, /href="\/login\/"/, "twin is the root-language page");
    assert.match(html, /name="lang" value="de"/);
    assert.throws(() => renderLoginPage({ slug: "x" }, "fr"), /texts/);
});
