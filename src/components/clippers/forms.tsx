"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/clippers/actions";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

export function Feedback({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p
      className={`mt-3 rounded-lg px-3 py-2 text-sm ${
        state.error
          ? "bg-red-500/10 text-red-400"
          : "bg-emerald-500/10 text-emerald-400"
      }`}
    >
      {state.error ?? state.ok}
    </p>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder:text-white/40 outline-none transition focus:border-cf-orange";

export const buttonCls =
  "inline-flex items-center justify-center rounded-full bg-cf-orange px-6 py-3 text-sm font-semibold text-cf-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50";

export function AuthForm({
  action,
  mode,
}: {
  action: Action;
  mode: "signup" | "login";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <input
          name="name"
          placeholder="Name or nickname"
          required
          className={inputCls}
          autoComplete="name"
        />
      )}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className={inputCls}
        autoComplete="email"
      />
      <input
        name="password"
        type="password"
        placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
        required
        minLength={mode === "signup" ? 8 : undefined}
        className={inputCls}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />
      <button disabled={pending} className={`${buttonCls} w-full`}>
        {pending
          ? "One sec…"
          : mode === "signup"
            ? "Create account"
            : "Log in"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function SingleFieldForm({
  action,
  name,
  placeholder,
  buttonLabel,
  defaultValue,
}: {
  action: Action;
  name: string;
  placeholder: string;
  buttonLabel: string;
  defaultValue?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required
          className={inputCls}
        />
        <button disabled={pending} className={`${buttonCls} shrink-0`}>
          {pending ? "Working…" : buttonLabel}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function SettingsForm({
  action,
  rpm,
  budget,
  active,
}: {
  action: Action;
  rpm: number;
  budget: number;
  active: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-white/60">
            Rate — $ per 1,000 views (RPM)
          </span>
          <input
            name="rpm"
            type="number"
            step="0.01"
            min="0"
            defaultValue={rpm}
            required
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-white/60">
            Total campaign budget ($)
          </span>
          <input
            name="budget"
            type="number"
            step="0.01"
            min="0"
            defaultValue={budget}
            required
            className={inputCls}
          />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm text-white/80">
        <input
          name="active"
          type="checkbox"
          defaultChecked={active}
          className="h-4 w-4 accent-[#ff6b1a]"
        />
        Campaign active (untick to pause all earning instantly)
      </label>
      <button disabled={pending} className={buttonCls}>
        {pending ? "Saving…" : "Save settings"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function RefreshButton({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction}>
      <button
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full border border-cf-orange px-6 py-3 text-sm font-semibold text-cf-orange transition hover:bg-cf-orange hover:text-cf-black disabled:opacity-50"
      >
        {pending ? "Checking TikTok… (can take a minute)" : "Refresh views now"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function PayTypeForm({
  action,
  userId,
  current,
  dealAmount,
  dealPeriod,
  label,
}: {
  action: Action;
  userId: number;
  current: "per_view" | "fixed";
  dealAmount?: number;
  dealPeriod?: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const toFixed = current === "per_view";
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="pay_type" value={toFixed ? "fixed" : "per_view"} />
      {toFixed && (
        <>
          <input
            name="deal_amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="$"
            defaultValue={dealAmount || undefined}
            required
            className="w-20 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-cf-orange"
          />
          <select
            name="deal_period"
            defaultValue={dealPeriod || "weekly"}
            className="rounded-lg border border-white/15 bg-cf-black px-2 py-2 text-sm text-white outline-none focus:border-cf-orange"
          >
            <option value="weekly">/ week</option>
            <option value="monthly">/ month</option>
          </select>
        </>
      )}
      <button
        disabled={pending}
        className="rounded-full border border-cf-orange/40 bg-cf-orange/10 px-4 py-2 text-sm font-semibold text-cf-orange transition hover:bg-cf-orange hover:text-cf-black disabled:opacity-50"
      >
        {pending ? "…" : (label ?? (toFixed ? "Move to fixed rate" : "Move to per-view"))}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function PaymentForm({
  action,
  userId,
}: {
  action: Action;
  userId: number;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input
        name="amount"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="$"
        required
        className="w-24 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-cf-orange"
      />
      <input
        name="note"
        placeholder="note (optional)"
        className="w-32 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-cf-orange"
      />
      <button
        disabled={pending}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
      >
        {pending ? "…" : "Mark paid"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
