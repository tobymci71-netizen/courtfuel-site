import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/clippers/auth";
import { logout } from "@/lib/clippers/actions";

export const metadata: Metadata = {
  title: "CourtFuel Clippers — get paid to post",
  description:
    "Post CourtFuel content on TikTok and get paid per 1,000 views.",
  robots: { index: true, follow: true },
};

export default async function ClippersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <div className="min-h-screen bg-cf-black text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Court<span className="text-cf-orange">Fuel</span>{" "}
          <span className="text-white/50">Clippers</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/clippers/rules"
            className="text-white/70 transition hover:text-white"
          >
            Guide
          </Link>
          {user ? (
            <>
              <Link
                href="/clippers/dashboard"
                className="text-white/70 transition hover:text-white"
              >
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/clippers/admin"
                  className="text-white/70 transition hover:text-white"
                >
                  Admin
                </Link>
              )}
              <form action={logout}>
                <button className="text-white/50 transition hover:text-white">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/clippers/login"
                className="text-white/70 transition hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/clippers/signup"
                className="rounded-full bg-cf-orange px-4 py-2 font-semibold text-cf-black transition hover:brightness-110"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-24">{children}</main>
    </div>
  );
}
