// The doors themselves: does /api/login only open for the right pair, does it
// only ever redirect within the site, does it refuse without a signing secret,
// and does /api/logout really end the session? Runs the real handlers.
import assert from "node:assert/strict";
import test from "node:test";

import { resolveConfig } from "../lib/hub/config.mjs";
import { createLogin, safeTarget } from "../lib/hub/login.mjs";
import { createLogout } from "../lib/hub/logout.mjs";
import { credentialsFrom, verifySessionValue } from "../lib/hub/session.mjs";

const raw = { slug: "demo", title: "Demo", locale: "de" };
const config = resolveConfig(raw);
const baseEnv = { SITE_PASSWORD: "site-pw", SESSION_SECRET: "test-session-secret", CONTEXT: "production" };
const makeEnv = (vars = {}) => {
    const all = { ...baseEnv, ...vars };
    return (key) => all[key];
};

const post = (login, fields, base = "https://example.test") =>
    login(
        new Request(`${base}/api/login`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(fields).toString(),
        }),
    );

const setCookie = (res) => {
    const header = res.headers.get("set-cookie");
    if (!header) return null;
    const match = header.match(/^demo_session=([^;]*)/);
    assert.ok(match, `unexpected Set-Cookie: ${header}`);
    return { value: match[1], header };
};

const login = createLogin(raw, makeEnv());
const creds = credentialsFrom(makeEnv(), config);

test("the right pair signs in and lands where it was going", async () => {
    const res = await post(login, { user: "training", password: "site-pw", to: "/exercises", lang: "de" });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "https://example.test/exercises");
    const cookie = setCookie(res);
    assert.equal(await verifySessionValue(cookie.value, creds), true);
    assert.match(cookie.header, /HttpOnly/);
    assert.match(cookie.header, /SameSite=Lax/);
    assert.match(cookie.header, /Secure/);
});

test("over plain http (netlify dev) the cookie is not marked Secure", async () => {
    const res = await post(login, { user: "training", password: "site-pw", to: "/", lang: "de" }, "http://localhost:8888");
    assert.ok(!setCookie(res).header.includes("Secure"));
});

test("a wrong pair goes back to the sign-in page, empty-handed", async () => {
    const res = await post(login, { user: "training", password: "guessed", to: "/admin", lang: "de" });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), `https://example.test/login/?error=1&to=${encodeURIComponent("/admin")}`);
    assert.equal(res.headers.get("set-cookie"), null);
});

test("the second language gets its own sign-in page and start page", async () => {
    const wrong = await post(login, { user: "x", password: "y", to: "/en/exercises/", lang: "en" });
    assert.match(wrong.headers.get("location"), /\/en\/login\/\?error=1/);
    const evil = await post(login, { user: "training", password: "site-pw", to: "//evil.example/", lang: "en" });
    assert.equal(evil.headers.get("location"), "https://example.test/en/");
});

test("the redirect target cannot leave the site", async () => {
    for (const to of [
        "https://evil.example/",
        "//evil.example/",
        "javascript:alert(1)",
        "exercises",
        "",
        "/\\evil.example", // the URL parser reads \ as /
        "/\t/evil.example", // ...and drops tabs
        "/\n/evil.example", // ...and newlines
        "/\r/evil.example",
        "/\\/evil.example",
    ]) {
        const res = await post(login, { user: "training", password: "site-pw", to, lang: "de" });
        assert.equal(res.headers.get("location"), "https://example.test/", `to=${JSON.stringify(to)} must fall back`);
    }
});

test("a same-site path with query and hash survives intact", async () => {
    const res = await post(login, { user: "training", password: "site-pw", to: "/exercises?a=1#b", lang: "de" });
    assert.equal(res.headers.get("location"), "https://example.test/exercises?a=1#b");
});

test("safeTarget uses the given fallback", () => {
    assert.equal(safeTarget("https://evil.example", "/en/"), "/en/");
    assert.equal(safeTarget("/ok", "/en/"), "/ok");
});

test("without SESSION_SECRET the sign-in refuses instead of using a weak key", async () => {
    const bare = createLogin(raw, makeEnv({ SESSION_SECRET: "" }));
    const res = await post(bare, { user: "training", password: "site-pw", to: "/", lang: "de" });
    assert.equal(res.status, 500);
    assert.equal(res.headers.get("set-cookie"), null);
});

test("with the gate off the sign-in just forwards", async () => {
    const open = createLogin(raw, makeEnv({ SITE_PASSWORD: "" }));
    const res = await post(open, { user: "", password: "", to: "/x", lang: "de" });
    assert.equal(res.headers.get("location"), "https://example.test/x");
    assert.equal(res.headers.get("set-cookie"), null);
});

test("only POST signs in", async () => {
    assert.equal((await login(new Request("https://example.test/api/login"))).status, 405);
});

test("sign-out deletes the cookie and lands on the sign-in page", async () => {
    const logout = createLogout(raw, makeEnv());
    const res = await logout(
        new Request("https://example.test/api/logout", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ lang: "en" }).toString(),
        }),
    );
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "https://example.test/en/login/");
    assert.equal(setCookie(res).value, "");
    assert.match(setCookie(res).header, /Max-Age=0/);
    const get = await logout(new Request("https://example.test/api/logout?lang=de"));
    assert.equal(get.headers.get("location"), "https://example.test/login/");
});
