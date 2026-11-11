import type { Metadata, Viewport } from "next";
import Link from "next/link";
import WaitlistForm from "@/components/links/WaitlistForm";
import { APP_STORE_HREF } from "@/components/home/app-store";
import { cleanSrc } from "@/lib/links/go";

// Where Android phones land from a /go link. CourtFuel is iPhone only today,
// so instead of a dead App Store button they can leave an email.

const TITLE = "CourtFuel for Android: join the list";
const DESCRIPTION =
  "CourtFuel isn't on Android yet. Leave your email and we'll tell you when it is.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/android" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default async function AndroidWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { from } = await searchParams;
  const src = cleanSrc(Array.isArray(from) ? from[0] : from);

  return (
    <div className="flex min-h-screen flex-col bg-cf-black text-white">
      <header className="mx-auto flex w-full max-w-md items-center gap-3 px-6 py-5">
        <img
          src="/home/app-icon.png"
          alt=""
          width={32}
          height={32}
          className="rounded-lg"
        />
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Court<span className="text-cf-orange">Fuel</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 pb-16 pt-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-cf-orange">
          Android
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight">
          CourtFuel isn&apos;t on Android yet.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-white/70">
          It&apos;s a training app built for your position: a week of drills for
          how you play, on iPhone today. Leave your email and we&apos;ll tell you
          when the Android app is out.
        </p>

        <div className="mt-8">
          <WaitlistForm from={src} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-white/45">
          One email when it launches, nothing else. For players aged 13 and over.{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
        </p>

        <p className="mt-10 border-t border-white/10 pt-6 text-sm text-white/60">
          On an iPhone?{" "}
          <a href={APP_STORE_HREF} className="font-semibold text-cf-orange hover:underline">
            Get CourtFuel on the App Store
          </a>
        </p>
      </main>
    </div>
  );
}
