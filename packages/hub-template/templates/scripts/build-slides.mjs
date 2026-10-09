// Builds the Slidev deck into site/docs/public/slides/ so the hub serves it at
// /slides/ (behind the same sign-in gate as the rest of the site).
//
//   node scripts/build-slides.mjs
//
// SLIDES_SKIP=1 skips the deck build (faster iteration on the hub pages).
import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "site/docs/public/slides");

if (process.env.SLIDES_SKIP) {
    console.log("SLIDES_SKIP is set, not building the deck.");
    process.exit(0);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
execSync(`npx slidev build deck/slides.md --base /slides/ --out "${out}"`, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1", SLIDEV_PROFILE: "none" },
});
