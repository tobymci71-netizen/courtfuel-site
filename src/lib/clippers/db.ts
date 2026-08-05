import "server-only";
import postgres from "postgres";

// One shared connection pool per lambda instance. `prepare: false` keeps it
// compatible with transaction-mode poolers (Supabase pgbouncer, Neon pooler).
declare global {
  // eslint-disable-next-line no-var
  var __cfSql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __cfSchemaReady: Promise<void> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel → Project → Settings → Environment Variables.",
    );
  }
  const local = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, {
    ssl: local ? false : "require",
    max: 1,
    prepare: false,
  });
}

// Lazy: the connection (and the DATABASE_URL check) only happens on first
// actual query, never at build time.
function client() {
  return globalThis.__cfSql ?? (globalThis.__cfSql = createClient());
}

export const sql = new Proxy(function () {} as unknown as ReturnType<typeof postgres>, {
  apply: (_target, _thisArg, args) =>
    (client() as unknown as (...a: unknown[]) => unknown)(...args),
  get: (_target, prop) => {
    const c = client() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(c) : value;
  },
}) as ReturnType<typeof postgres>;

// Idempotent schema setup, run once per instance before first query.
async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS cf_users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name  TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'clipper',
      payout_method TEXT NOT NULL DEFAULT '',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS cf_accounts (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES cf_users(id) ON DELETE CASCADE,
      url        TEXT NOT NULL,
      handle     TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (handle)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS cf_videos (
      id            SERIAL PRIMARY KEY,
      user_id       INT NOT NULL REFERENCES cf_users(id) ON DELETE CASCADE,
      account_id    INT NOT NULL REFERENCES cf_accounts(id) ON DELETE CASCADE,
      url           TEXT NOT NULL,
      tiktok_id     TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      views         BIGINT NOT NULL DEFAULT 0,
      earned_cents  BIGINT NOT NULL DEFAULT 0,
      last_checked  TIMESTAMPTZ,
      track_error   TEXT NOT NULL DEFAULT '',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (tiktok_id)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS cf_settings (
      id                 INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      rpm_cents          INT NOT NULL DEFAULT 300,
      budget_cents       BIGINT NOT NULL DEFAULT 0,
      total_earned_cents BIGINT NOT NULL DEFAULT 0,
      campaign_active    BOOLEAN NOT NULL DEFAULT true,
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS cf_payments (
      id           SERIAL PRIMARY KEY,
      user_id      INT NOT NULL REFERENCES cf_users(id) ON DELETE CASCADE,
      amount_cents BIGINT NOT NULL,
      note         TEXT NOT NULL DEFAULT '',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  await sql`INSERT INTO cf_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
  // Per-user pay model: 'per_view' (campaign RPM + budget) or 'fixed' (flat
  // deal agreed off-platform — views tracked, no RPM accrual).
  await sql`ALTER TABLE cf_users ADD COLUMN IF NOT EXISTS pay_type TEXT NOT NULL DEFAULT 'per_view'`;
  await sql`ALTER TABLE cf_users ADD COLUMN IF NOT EXISTS deal_note TEXT NOT NULL DEFAULT ''`;
  // Structured fixed-rate deal: amount + cadence + when the deal started.
  await sql`ALTER TABLE cf_users ADD COLUMN IF NOT EXISTS deal_amount_cents BIGINT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE cf_users ADD COLUMN IF NOT EXISTS deal_period TEXT NOT NULL DEFAULT 'weekly'`;
  await sql`ALTER TABLE cf_users ADD COLUMN IF NOT EXISTS deal_started_at TIMESTAMPTZ`;
}

export function ensureSchema(): Promise<void> {
  if (!globalThis.__cfSchemaReady) {
    globalThis.__cfSchemaReady = migrate().catch((err) => {
      // Allow a retry on the next request instead of caching the failure.
      globalThis.__cfSchemaReady = undefined;
      throw err;
    });
  }
  return globalThis.__cfSchemaReady;
}

export type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  role: "clipper" | "admin";
  payout_method: string;
  pay_type: "per_view" | "fixed";
  deal_note: string;
  deal_amount_cents: number;
  deal_period: "weekly" | "monthly";
  deal_started_at: string | null;
};

export type AccountRow = {
  id: number;
  user_id: number;
  url: string;
  handle: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
};

export type VideoRow = {
  id: number;
  user_id: number;
  account_id: number;
  url: string;
  tiktok_id: string;
  status: "pending" | "approved" | "rejected";
  views: number;
  earned_cents: number;
  last_checked: string | null;
  track_error: string;
  created_at: string;
};

export type SettingsRow = {
  rpm_cents: number;
  budget_cents: number;
  total_earned_cents: number;
  campaign_active: boolean;
};
