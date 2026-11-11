import type { NextRequest } from "next/server";
import { handleGo } from "@/lib/links/handle";

// courtfuel.app/go/<account>, e.g. /go/stickvert. Any name works, so a new
// account or platform needs no code change: just use a new link.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ src: string }> },
) {
  const { src } = await params;
  return handleGo(req, src);
}
