import Link from "next/link";

function Wordmark() {
  return (
    <span className="font-semibold tracking-tight text-cf-black">
      Court<span className="text-cf-orange">Fuel</span>
    </span>
  );
}

export default function LegalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-cf-offwhite text-cf-black">
      <header className="border-b border-cf-black/10 bg-cf-offwhite">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl">
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="text-sm text-cf-black/60 transition hover:text-cf-orange"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-12 md:py-20">
        <article className="mx-auto max-w-[720px] prose-cf">{children}</article>
      </main>

      <footer className="border-t border-cf-black/10 px-6 py-8 text-center text-sm text-cf-black/50">
        © 2026 CourtFuel
      </footer>
    </div>
  );
}
