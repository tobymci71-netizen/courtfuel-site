import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import Markdown from "@/components/Markdown";

export const metadata: Metadata = {
  title: "Privacy Policy — CourtFuel",
  description: "How CourtFuel collects and handles your data.",
};

export default async function PrivacyPage() {
  const file = await fs.readFile(
    path.join(process.cwd(), "content", "privacy.md"),
    "utf8"
  );
  return (
    <LegalShell>
      <Markdown>{file}</Markdown>
    </LegalShell>
  );
}
