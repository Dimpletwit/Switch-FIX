import { handleTracker, clearExpiredLocations } from "./tracker.mjs";
import handler from "vinext/server/app-router-entry";

export default {
  async scheduled(_event: any, env: any) {
    await clearExpiredLocations(env);
  },
  async fetch(request: Request, env: any, ctx: any) {
    const trackerResponse = await handleTracker(request, env);
    if (trackerResponse) return trackerResponse;
    return handler.fetch(request, env, ctx);
  },
};
