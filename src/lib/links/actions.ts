"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/clippers/auth";
import { ensureSchema, sql } from "@/lib/clippers/db";
import { cleanSrc } from "./go";

// `email` comes back with an error so the field keeps what was typed.
export type WaitlistState =
  | { error?: string; ok?: string; email?: string }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The Android waitlist: one email per person, plus the link they came from.
export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const done = { ok: "You're on the list. We'll email you when it's out." };

  // Hidden field no person fills in. A filled one is a bot: say thanks, save nothing.
  if (String(formData.get("company") ?? "") !== "") return done;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email))
    return { error: "Enter a valid email address.", email: email.slice(0, 254) };
  const src = cleanSrc(String(formData.get("from") ?? ""));

  try {
    await ensureSchema();
    await sql`
      INSERT INTO cf_waitlist (email, src)
      VALUES (${email}, ${src})
      ON CONFLICT (email) DO NOTHING`;
  } catch (err) {
    console.error("waitlist: could not save", err);
    return { error: "That didn't save. Try again in a minute.", email };
  }
  return done;
}

// Admin only: take one address off the list (a test entry, spam, or a request).
export async function removeWaitlistEntry(formData: FormData) {
  const user = await getUser();
  if (!user || user.role !== "admin") return;
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await ensureSchema();
  await sql`DELETE FROM cf_waitlist WHERE id = ${id}`;
  revalidatePath("/clippers/admin/links");
}
