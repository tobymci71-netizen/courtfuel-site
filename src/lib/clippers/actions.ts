"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureSchema, sql, type UserRow } from "./db";
import { createSession, destroySession, getUser, isAdminEmail } from "./auth";
import { parsePostUrl, parseProfileUrl } from "./tiktok";
import { refreshViews } from "./engine";

export type FormState = { error?: string; ok?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireUser(): Promise<UserRow> {
  const user = await getUser();
  if (!user) redirect("/clippers/login");
  return user;
}

async function requireAdmin(): Promise<UserRow> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/clippers/dashboard");
  return user;
}

// --- Auth ------------------------------------------------------------------

export async function signup(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (name.length < 2) return { error: "Enter your name or nickname." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  await ensureSchema();
  const hash = await bcrypt.hash(password, 10);
  const role = isAdminEmail(email) ? "admin" : "clipper";

  let userId: number;
  try {
    const [row] = await sql<{ id: number }[]>`
      INSERT INTO cf_users (email, password_hash, display_name, role)
      VALUES (${email}, ${hash}, ${name}, ${role})
      RETURNING id`;
    userId = row.id;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "23505")
      return { error: "An account with that email already exists. Log in instead." };
    throw err;
  }

  await createSession(userId);
  redirect(role === "admin" ? "/clippers/admin" : "/clippers/dashboard");
}

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  await ensureSchema();
  const [user] = await sql<UserRow[]>`
    SELECT * FROM cf_users WHERE email = ${email}`;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { error: "Wrong email or password." };
  }

  // Keep the admin flag in sync with the ADMIN_EMAILS env var.
  if (user.role !== "admin" && isAdminEmail(user.email)) {
    await sql`UPDATE cf_users SET role = 'admin' WHERE id = ${user.id}`;
    user.role = "admin";
  }

  await createSession(user.id);
  redirect(user.role === "admin" ? "/clippers/admin" : "/clippers/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/clippers");
}

// --- Clipper: submissions --------------------------------------------------

export async function submitAccount(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const raw = String(formData.get("url") ?? "");
  const parsed = parseProfileUrl(raw);
  if (!parsed)
    return {
      error:
        "That doesn't look like a TikTok account. Paste a link like tiktok.com/@yourhandle",
    };

  try {
    await sql`
      INSERT INTO cf_accounts (user_id, url, handle)
      VALUES (${user.id}, ${parsed.cleanUrl}, ${parsed.handle})`;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505")
      return { error: "That TikTok account has already been submitted." };
    throw err;
  }
  revalidatePath("/clippers/dashboard");
  return { ok: `Submitted @${parsed.handle} — you'll be able to post videos once it's approved.` };
}

export async function submitVideo(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const raw = String(formData.get("url") ?? "");
  const parsed = parsePostUrl(raw);
  if (!parsed)
    return {
      error:
        "That doesn't look like a TikTok video or slideshow link. It should look like tiktok.com/@you/video/123… or /photo/123…",
    };

  // The post must come from one of the clipper's APPROVED accounts.
  const [account] = await sql<{ id: number }[]>`
    SELECT id FROM cf_accounts
    WHERE user_id = ${user.id} AND handle = ${parsed.handle} AND status = 'approved'`;
  if (!account)
    return {
      error: `@${parsed.handle} isn't one of your approved accounts. Submit the account first and wait for approval.`,
    };

  try {
    await sql`
      INSERT INTO cf_videos (user_id, account_id, url, tiktok_id)
      VALUES (${user.id}, ${account.id}, ${parsed.cleanUrl}, ${parsed.tiktokId})`;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505")
      return { error: "That video has already been submitted." };
    throw err;
  }
  revalidatePath("/clippers/dashboard");
  return { ok: "Video submitted — it starts earning once approved." };
}

export async function savePayoutMethod(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const method = String(formData.get("payout_method") ?? "").trim().slice(0, 200);
  await sql`UPDATE cf_users SET payout_method = ${method} WHERE id = ${user.id}`;
  revalidatePath("/clippers/dashboard");
  return { ok: "Payout details saved." };
}

// --- Admin -----------------------------------------------------------------

export async function reviewAccount(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  if (!Number.isInteger(id) || !["approved", "rejected"].includes(decision))
    return;
  await sql`UPDATE cf_accounts SET status = ${decision} WHERE id = ${id}`;
  revalidatePath("/clippers/admin");
}

export async function reviewVideo(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision"));
  if (!Number.isInteger(id) || !["approved", "rejected"].includes(decision))
    return;
  await sql`UPDATE cf_videos SET status = ${decision} WHERE id = ${id}`;
  revalidatePath("/clippers/admin");
}

export async function updateSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const rpm = Number(formData.get("rpm"));
  const budget = Number(formData.get("budget"));
  const active = formData.get("active") === "on";

  if (!Number.isFinite(rpm) || rpm < 0 || rpm > 1000)
    return { error: "RPM must be between $0 and $1000 per 1K views." };
  if (!Number.isFinite(budget) || budget < 0 || budget > 10_000_000)
    return { error: "Budget must be a positive dollar amount." };

  const rpmCents = Math.round(rpm * 100);
  const budgetCents = Math.round(budget * 100);

  await ensureSchema();
  await sql`
    UPDATE cf_settings
    SET rpm_cents = ${rpmCents},
        budget_cents = ${budgetCents},
        campaign_active = ${active},
        updated_at = now()
    WHERE id = 1`;
  revalidatePath("/clippers/admin");
  revalidatePath("/clippers");
  return { ok: "Campaign settings saved." };
}

export async function recordPayment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const userId = Number(formData.get("user_id"));
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  if (!Number.isInteger(userId)) return { error: "Bad user." };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: "Enter the amount you paid (in dollars)." };

  await sql`
    INSERT INTO cf_payments (user_id, amount_cents, note)
    VALUES (${userId}, ${Math.round(amount * 100)}, ${note})`;
  revalidatePath("/clippers/admin");
  return { ok: "Payment recorded." };
}

// Stops a dead/unreadable video being re-checked every refresh (each check
// costs money). Keeps the row and its earnings history intact — only
// 'approved' videos are refreshed, so this simply retires it.
// Remove a post from tracking and from every total (or put it back).
// Removing also credits any budget it consumed back to the campaign.
export async function stopTracking(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const restore = String(formData.get("resume") ?? "") === "1";
  if (!Number.isInteger(id)) return;

  await sql.begin(async (tx) => {
    const [v] = await tx<
      { earned_cents: string; status: string; pay_type: string }[]
    >`SELECT v.earned_cents, v.status, u.pay_type
      FROM cf_videos v JOIN cf_users u ON u.id = v.user_id
      WHERE v.id = ${id} FOR UPDATE OF v`;
    if (!v) return;
    const cents = Number(v.earned_cents);
    const perView = v.pay_type === "per_view";

    if (restore) {
      if (v.status !== "removed") return;
      await tx`
        UPDATE cf_videos
        SET status = 'approved', tracking = true, missed_count = 0, track_error = ''
        WHERE id = ${id}`;
      if (cents > 0 && perView) {
        await tx`
          UPDATE cf_settings
          SET total_earned_cents = total_earned_cents + ${cents}, updated_at = now()
          WHERE id = 1`;
      }
      return;
    }

    if (v.status === "removed") return;
    await tx`
      UPDATE cf_videos
      SET status = 'removed',
          tracking = false,
          track_error = 'Removed — you stopped tracking this post.'
      WHERE id = ${id}`;
    if (cents > 0 && perView) {
      await tx`
        UPDATE cf_settings
        SET total_earned_cents = GREATEST(0, total_earned_cents - ${cents}),
            updated_at = now()
        WHERE id = 1`;
    }
  });

  revalidatePath("/clippers/admin");
  revalidatePath("/clippers/admin/fixed");
  revalidatePath("/clippers/dashboard");
}

export async function setPayType(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const userId = Number(formData.get("user_id"));
  const payType = String(formData.get("pay_type"));
  if (!Number.isInteger(userId) || !["per_view", "fixed"].includes(payType))
    return { error: "Bad request." };

  await ensureSchema();
  if (payType === "fixed") {
    const amount = Number(formData.get("deal_amount"));
    const period = String(formData.get("deal_period"));
    if (!Number.isFinite(amount) || amount <= 0)
      return { error: "Enter the deal amount in dollars (e.g. 50)." };
    if (!["weekly", "monthly"].includes(period))
      return { error: "Pick weekly or monthly." };
    await sql`
      UPDATE cf_users
      SET pay_type = 'fixed',
          deal_amount_cents = ${Math.round(amount * 100)},
          deal_period = ${period},
          deal_started_at = COALESCE(deal_started_at, now())
      WHERE id = ${userId} AND role = 'clipper'`;
  } else {
    await sql`
      UPDATE cf_users
      SET pay_type = 'per_view', deal_started_at = NULL
      WHERE id = ${userId} AND role = 'clipper'`;
  }
  revalidatePath("/clippers/admin");
  revalidatePath("/clippers/dashboard");
  return {
    ok:
      payType === "fixed"
        ? "Moved to fixed rate — views tracked, paid on schedule, no campaign budget used."
        : "Moved to per-view — their videos now earn at the campaign RPM.",
  };
}

export async function adminRefreshViews(
  _prev: FormState,
): Promise<FormState> {
  await requireAdmin();
  try {
    const r = await refreshViews();
    revalidatePath("/clippers/admin");
    revalidatePath("/clippers/dashboard");
    const bits = [
      `Scanned ${r.autoScanned} public posts across the approved accounts`,
      `updated ${r.updated} videos`,
      `added $${(r.earnedCentsAdded / 100).toFixed(2)} in earnings`,
    ];
    if (r.discovered) bits.push(`found ${r.discovered} new posts`);
    if (r.retired)
      bits.push(
        `removed ${r.retired} no longer public (views taken out of totals)`,
      );
    if (r.restored) bits.push(`restored ${r.restored} that came back`);
    if (r.budgetExhausted) bits.push("budget is fully used");
    if (r.errors.length) bits.push(`errors: ${r.errors[0]}`);
    return { ok: bits.join(", ") + "." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Refresh failed." };
  }
}
