import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import Markdown from "@/components/Markdown";

export const metadata: Metadata = {
  title: "Terms of Use — CourtFuel",
  description: "The terms that govern your use of CourtFuel.",
};

export default async function TermsPage() {
  const file = await fs.readFile(
    path.join(process.cwd(), "content", "terms.md"),
    "utf8"
  );
  return (
    <LegalShell>
      <Markdown>{file}</Markdown>
    </LegalShell>
  );
}
