// Writes the sign-in pages from hub.config.mjs into site/docs/public/. They are
// generated (and git-ignored) so they can never drift from the config or from
// the managed code in netlify/lib/hub/.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import hub from "../hub.config.mjs";
import { resolveConfig, loginPath } from "../netlify/lib/hub/config.mjs";
import { renderLoginPage } from "../netlify/lib/hub/login-page.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = resolveConfig(hub);

for (const lang of [config.locale, config.other]) {
    const file = resolve(root, "site/docs/public", `.${loginPath(config, lang)}`, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderLoginPage(hub, lang));
    console.log(`Wrote ${file.replace(root + "/", "")}`);
}
