import type { NextRequest } from "next/server";
import { handleGo } from "@/lib/links/handle";

// courtfuel.app/go with no account name: counted as "direct".
export function GET(req: NextRequest) {
  return handleGo(req);
}
