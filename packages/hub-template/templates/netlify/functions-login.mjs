// Starts a session: POST /api/login. The logic lives in the managed
// netlify/lib/hub/ (see `npm run hub:sync`); this wrapper only adds what
// Netlify reads statically from the function file: the route and the rate
// limit (at most 10 attempts per minute and IP; the user name is a well-known
// default, so only the password is left to guess).
import hub from "../../hub.config.mjs";
import { createLogin } from "../lib/hub/login.mjs";

export default createLogin(hub);

export const config = {
    path: "/api/login",
    rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
