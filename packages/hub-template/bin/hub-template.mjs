#!/usr/bin/env node
// hub-template: keep the managed sign-in code in a training repo current.
//
//   hub-template sync     copy lib/hub/* into netlify/lib/hub/ (and write VERSION)
//   hub-template check    exit 1 when netlify/lib/hub/ differs from this version
//
// The edge function runs on Deno and the functions on Node, and Netlify bundles
// them separately, so the shared code is vendored into the repo (netlify/lib/hub)
// instead of imported from node_modules. These two commands are what keeps that
// copy from drifting: `sync` updates it, `check` (run in CI) fails when it is
// stale or has been edited by hand.

import { existsSync, readFileSync } from "node:fs";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "..", "lib", "hub");
const SELF = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8"));
const TARGET = resolve(process.cwd(), "netlify", "lib", "hub");

const read = (dir, name) => readFileSync(join(dir, name), "utf8");

async function listFiles(dir) {
    return (await readdir(dir)).filter((n) => n.endsWith(".mjs")).sort();
}

export async function sync(target = TARGET) {
    await rm(target, { recursive: true, force: true });
    await mkdir(target, { recursive: true });
    for (const name of await listFiles(SOURCE)) await cp(join(SOURCE, name), join(target, name));
    await writeFile(join(target, "VERSION"), `${SELF.version}\n`);
    return SELF.version;
}

export async function check(target = TARGET) {
    if (!existsSync(target)) return { ok: false, reason: `${target} is missing, run "hub-template sync"` };
    const expected = await listFiles(SOURCE);
    const actual = await listFiles(target);
    if (expected.join() !== actual.join()) return { ok: false, reason: "file list differs, run \"hub-template sync\"" };
    for (const name of expected) {
        if (read(SOURCE, name) !== read(target, name)) {
            return { ok: false, reason: `${name} differs from @miragon/hub-template ${SELF.version}, run "hub-template sync"` };
        }
    }
    return { ok: true };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [command] = process.argv.slice(2);
    if (command === "sync") {
        console.log(`Synced netlify/lib/hub from @miragon/hub-template ${await sync()}`);
    } else if (command === "check") {
        const result = await check();
        if (!result.ok) {
            console.error(`netlify/lib/hub is out of date: ${result.reason}`);
            process.exit(1);
        }
        console.log("netlify/lib/hub matches @miragon/hub-template");
    } else {
        console.log("Usage: hub-template <sync|check>");
        process.exit(command ? 1 : 0);
    }
}
