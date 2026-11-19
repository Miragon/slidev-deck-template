// The edge gate: who is let through, who is sent to the sign-in page, and what
// happens when SESSION_SECRET is missing.
import assert from "node:assert/strict";
import test from "node:test";

import { resolveConfig } from "../lib/hub/config.mjs";
import { createGate } from "../lib/hub/gate.mjs";
import { createSessionValue, credentialsFrom } from "../lib/hub/session.mjs";

const raw = { slug: "demo", title: "Demo", locale: "de" };
const env = (vars) => (key) => vars[key];
const on = { SITE_PASSWORD: "site-pw", SESSION_SECRET: "s3cret" };
const gate = createGate(raw, env(on));
const at = (path, headers = {}) => new Request(`https://example.test${path}`, { headers });

test("no password, no gate", async () => {
    assert.equal(await createGate(raw, env({}))(at("/anything")), undefined);
});

test("the sign-in pages and session endpoints stay open", async () => {
    for (const path of ["/login", "/login/", "/en/login/", "/api/login", "/api/logout", "/komet.svg", "/fonts/x.woff2"]) {
        assert.equal(await gate(at(path)), undefined, path);
    }
});

test("the raw login function is NOT open, so the rate limit cannot be walked around", async () => {
    const res = await gate(at("/.netlify/functions/login"));
    assert.equal(res.status, 401);
});

test("an anonymous page request goes to the sign-in page of its language and comes back", async () => {
    const de = await gate(at("/exercises?x=1"));
    assert.equal(de.status, 302);
    assert.equal(de.headers.get("location"), `https://example.test/login/?to=${encodeURIComponent("/exercises?x=1")}`);
    const en = await gate(at("/en/setup"));
    assert.equal(en.headers.get("location"), `https://example.test/en/login/?to=${encodeURIComponent("/en/setup")}`);
});

test("an anonymous API call gets JSON, not a redirect", async () => {
    const res = await gate(at("/api/anything"));
    assert.equal(res.status, 401);
    assert.match(res.headers.get("content-type"), /json/);
});

test("a valid session passes, a forged one does not", async () => {
    const creds = credentialsFrom(env(on), resolveConfig(raw));
    const value = await createSessionValue(creds);
    assert.equal(await gate(at("/exercises", { cookie: `demo_session=${value}` })), undefined);
    assert.equal((await gate(at("/exercises", { cookie: "demo_session=forged" }))).status, 302);
});

test("gate on without SESSION_SECRET answers 503 instead of a login nobody can complete", async () => {
    const res = await createGate(raw, env({ SITE_PASSWORD: "site-pw" }))(at("/exercises"));
    assert.equal(res.status, 503);
});
