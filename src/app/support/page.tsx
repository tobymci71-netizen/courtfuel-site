import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Support — CourtFuel",
  description: "Get help with CourtFuel.",
};

export default function SupportPage() {
  return (
    <LegalShell>
      <h1 className="mb-6 text-4xl font-bold tracking-tight text-cf-black">
        CourtFuel Support
      </h1>
      <p className="my-4 text-[17px] leading-[1.7] text-cf-black/85">
        Need help? Reach me at{" "}
        {/* TODO: replace contact@courtfuel.app with the real support email once set up */}
        <a
          href="mailto:contact@courtfuel.app"
          className="font-semibold text-cf-orange underline-offset-2 hover:underline"
        >
          contact@courtfuel.app
        </a>{" "}
        (email coming soon) and I&apos;ll get back to you within 48 hours.
      </p>

      <h2 className="mt-12 mb-4 text-2xl font-semibold tracking-tight text-cf-black">
        Common questions
      </h2>

      <ul className="my-4 list-disc space-y-3 pl-6 text-[17px] leading-[1.7] text-cf-black/85">
        <li>
          <strong className="font-semibold text-cf-black">
            How do scans work?
          </strong>{" "}
          Point your camera at any meal and tap capture. Free users get 2 scans
          per day; Pro users get unlimited.
        </li>
        <li>
          <strong className="font-semibold text-cf-black">
            How do I cancel my subscription?
          </strong>{" "}
          Settings → Apple ID → Subscriptions on your device.
        </li>
        <li>
          <strong className="font-semibold text-cf-black">
            How do I delete my account?
          </strong>{" "}
          In the app: Profile → Delete account.
        </li>
        <li>
          <strong className="font-semibold text-cf-black">
            Is my data private?
          </strong>{" "}
          Yes — see our{" "}
          <a
            href="/privacy"
            className="text-cf-orange underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </li>
      </ul>
    </LegalShell>
  );
}
