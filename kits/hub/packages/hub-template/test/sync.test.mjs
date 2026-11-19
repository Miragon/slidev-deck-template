import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { check, sync } from "../bin/hub-template.mjs";

test("sync copies the managed files and check notices drift", async () => {
    const target = join(await mkdtemp(join(tmpdir(), "hub-sync-")), "netlify", "lib", "hub");
    assert.equal((await check(target)).ok, false, "missing target");
    const version = await sync(target);
    assert.match((await readFile(join(target, "VERSION"), "utf8")).trim(), new RegExp(`^${version}$`));
    assert.deepEqual(await check(target), { ok: true });
    await writeFile(join(target, "session.mjs"), "// edited by hand\n");
    const drift = await check(target);
    assert.equal(drift.ok, false);
    assert.match(drift.reason, /session\.mjs/);
    await sync(target);
    assert.deepEqual(await check(target), { ok: true });
});
