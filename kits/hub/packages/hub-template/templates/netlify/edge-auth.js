// The sign-in gate for the whole site: see netlify/lib/hub/gate.mjs for what it
// lets through and what it needs (SITE_PASSWORD, SESSION_SECRET).
import hub from "../../hub.config.mjs";
import { createGate } from "../lib/hub/gate.mjs";

export default createGate(hub);

// Gate every path (pages and assets).
export const config = { path: "/*" };
