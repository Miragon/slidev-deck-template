// Ends the session: POST (or GET) /api/logout. See netlify/lib/hub/logout.mjs.
import hub from "../../hub.config.mjs";
import { createLogout } from "../lib/hub/logout.mjs";

export default createLogout(hub);
