import "server-only";
import { after, NextResponse, type NextRequest } from "next/server";
import { appStoreUrl, cleanSrc, platformOf } from "./go";
import { recordTap } from "./store";

// Shared by /go and /go/[src]. A plain HTTP redirect, the same thing an App
// Store campaign link does, so nothing has to load or run on the phone first.
export function handleGo(req: NextRequest, rawSrc?: string) {
  const src = cleanSrc(rawSrc);
  const platform = platformOf(req.headers.get("user-agent") ?? "");

  let target: string | URL;
  if (platform === "ios") {
    target = appStoreUrl(src);
  } else if (platform === "android") {
    target = new URL(`/android?from=${src}`, req.url);
  } else {
    target = new URL("/", req.url);
  }

  // Counted after the redirect has gone out, so a slow or missing database
  // can never hold up or break the link.
  if (platform !== "bot") {
    after(async () => {
      try {
        await recordTap(src, platform);
      } catch (err) {
        console.error("go: tap not counted", err);
      }
    });
  }

  const res = NextResponse.redirect(target, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
