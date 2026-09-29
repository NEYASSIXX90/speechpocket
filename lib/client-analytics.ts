"use client";

import {track} from "@vercel/analytics";

export function trackToolCompleted(tool: string, action: string) {
  track("Tool completed", {tool, action});
}
