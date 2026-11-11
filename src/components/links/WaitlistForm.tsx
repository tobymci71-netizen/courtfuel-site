"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/lib/links/actions";

export default function WaitlistForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(joinWaitlist, undefined);

  if (state?.ok) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-emerald-500/10 px-5 py-4 text-base font-medium text-emerald-400"
      >
        {state.ok}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="from" value={from} />
      {/* Left empty by people; bots fill it in. Off screen, not display:none. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <label className="sr-only" htmlFor="waitlist-email">
        Email address
      </label>
      <input
        id="waitlist-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="Your email"
        defaultValue={state?.email ?? ""}
        required
        maxLength={254}
        className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3.5 text-base text-white placeholder:text-white/40 outline-none transition focus:border-cf-orange"
      />
      <button
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-cf-orange px-6 py-3.5 text-base font-semibold text-cf-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "One sec…" : "Tell me when it's out"}
      </button>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
