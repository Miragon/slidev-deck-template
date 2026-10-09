// The session matrix. Small file, but it decides who gets past the gate, so
// every branch is pinned here, especially the ones where a cookie is tampered
// with, which is exactly how someone would try to get in.
import assert from "node:assert/strict";
import test from "node:test";

import { resolveConfig } from "../lib/hub/config.mjs";
import {
    cookieValue,
    createSessionValue,
    credentialsFrom,
    hasSession,
    matchesCredentials,
    sessionKeyMissing,
    sessionSetCookie,
    verifySessionValue,
} from "../lib/hub/session.mjs";

const config = resolveConfig({ slug: "demo-training", title: "Demo" });
const env = (vars) => (key) => vars[key];
const gated = credentialsFrom(env({ SITE_PASSWORD: "site-pw", SESSION_SECRET: "a-long-random-secret" }), config);

const request = (cookie) => new Request("https://example.test/", { headers: cookie ? { cookie } : {} });

test("the cookie is named after the slug", () => {
    assert.equal(gated.cookieName, "demo_training_session");
    assert.match(sessionSetCookie(gated, "v"), /^demo_training_session=v; /);
});

test("the credential pair checks out, everything else does not", () => {
    assert.equal(matchesCredentials("training", "site-pw", gated), true);
    for (const [user, password] of [
        ["training", "guessed"],
        ["someone", "site-pw"],
        ["training", ""],
        ["", ""],
        ["training", "site-pw "],
    ]) {
        assert.equal(matchesCredentials(user, password, gated), false, `${user}:${password}`);
    }
});

test("a blank password never authenticates", () => {
    const blank = { ...gated, sitePassword: "" };
    assert.equal(matchesCredentials("training", "", blank), false);
});

test("SITE_USER overrides the configured default", () => {
    const creds = credentialsFrom(env({ SITE_USER: "alice", SITE_PASSWORD: "x", SESSION_SECRET: "s" }), config);
    assert.equal(creds.siteUser, "alice");
});

test("a minted session verifies", async () => {
    assert.equal(await verifySessionValue(await createSessionValue(gated), gated), true);
});

test("a tampered cookie is no session", async () => {
    const value = await createSessionValue(gated);
    const [v, expires, signature] = value.split(".");
    for (const forged of [
        "",
        "garbage",
        `${v}.${expires}`,
        `${v}.${Number(expires) + 1}.${signature}`,
        `v2.${expires}.${signature}`,
        `${v}.${expires}.${signature.slice(0, -2)}AA`,
        `${v}.${expires}.not base64!`,
        `${v}.abc.${signature}`,
    ]) {
        assert.equal(await verifySessionValue(forged, gated), false, forged);
    }
});

test("an expired session is over", async () => {
    const value = await createSessionValue(gated, { now: 1_000_000 });
    assert.equal(await verifySessionValue(value, gated, { now: 1_000_001 }), true);
    assert.equal(await verifySessionValue(value, gated, { now: Date.now() + 365 * 24 * 3600 * 1000 }), false);
});

test("changing the password revokes the sessions it signed", async () => {
    const value = await createSessionValue(gated);
    assert.equal(await verifySessionValue(value, { ...gated, sitePassword: "rotated" }), false);
});

test("a different SESSION_SECRET does not verify what another signed", async () => {
    const value = await createSessionValue(gated);
    assert.equal(await verifySessionValue(value, { ...gated, sessionSecret: "another" }), false);
});

test("another training's cookie does not open this one, even with the same secret", async () => {
    const other = credentialsFrom(env({ SITE_PASSWORD: "site-pw", SESSION_SECRET: "a-long-random-secret" }), resolveConfig({ slug: "other" }));
    assert.equal(await verifySessionValue(await createSessionValue(other), gated), false);
});

test("without SESSION_SECRET there are no sessions, not a guessable key", async () => {
    const bare = { ...gated, sessionSecret: "" };
    assert.equal(sessionKeyMissing(bare), true);
    assert.equal(sessionKeyMissing({ ...bare, sitePassword: "" }), false, "gate off: nothing to sign");
    assert.equal(sessionKeyMissing({ ...bare, isLocal: true }), false, "netlify dev has a dev secret");
    await assert.rejects(createSessionValue(bare));
    // A cookie signed with the local dev key must not pass in production.
    const forged = await createSessionValue({ ...bare, isLocal: true });
    assert.equal(await verifySessionValue(forged, bare), false);
});

test("netlify dev is recognised from CONTEXT or NETLIFY_DEV", () => {
    assert.equal(credentialsFrom(env({ CONTEXT: "dev" }), config).isLocal, true);
    assert.equal(credentialsFrom(env({ NETLIFY_DEV: "true" }), config).isLocal, true);
    assert.equal(credentialsFrom(env({ CONTEXT: "production" }), config).isLocal, false);
});

test("hasSession reads the cookie off a request", async () => {
    const value = await createSessionValue(gated);
    assert.equal(await hasSession(request(`demo_training_session=${value}`), gated), true);
    assert.equal(await hasSession(request(`other=1; demo_training_session=${value}; theme=dark`), gated), true);
    assert.equal(await hasSession(request(""), gated), false);
    assert.equal(await hasSession(request("demo_training_session=forged"), gated), false);
});

test("cookie parsing copes with the header as browsers send it", () => {
    assert.equal(cookieValue("a=1; s=abc; b=2", "s"), "abc");
    assert.equal(cookieValue("sx=nope", "s"), "");
    assert.equal(cookieValue(null, "s"), "");
    assert.equal(cookieValue("s", "s"), "", "no value at all");
});
