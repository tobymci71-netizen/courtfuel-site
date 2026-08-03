# Clipper portal — one-time setup

The clipper portal lives at **courtfuel.app/clippers**. Clippers sign up,
submit their TikTok account for your approval, then submit video links.
Views refresh automatically once a day, earnings accrue at your RPM, and
accrual hard-stops when the campaign budget is used up.

It needs 5 environment variables in Vercel
(**Project → Settings → Environment Variables**, add to Production +
Preview + Development):

## 1. `DATABASE_URL` — the database

Easiest path: in your Vercel project go to **Storage → Create Database →
Neon (Postgres)**, free tier is plenty. Vercel adds `DATABASE_URL`
automatically. (Supabase works too — copy its "connection pooling"
connection string.)

Tables create themselves on first use — no migration step.

## 2. `AUTH_SECRET` — signs login sessions

Any long random string. Generate one at https://generate-secret.vercel.app/32
or run `openssl rand -base64 32`.

## 3. `ADMIN_EMAILS` — who gets the admin dashboard

```
ADMIN_EMAILS=tobymci71@gmail.com
```

Sign up at /clippers/signup with this email and you land on the admin
dashboard instead of the clipper one. Comma-separate several emails if you
ever want a second admin.

## 4. `APIFY_TOKEN` — automatic view tracking

1. Create a free account at https://apify.com
2. Copy your token from **Settings → API & Integrations**
3. Cost: about $0.003 per video per refresh — 50 tracked videos checked
   daily ≈ $4.50/month. Apify's $5 free monthly credit covers roughly that.

## 5. `CRON_SECRET` — protects the refresh endpoint

Another random string (same generator as above). Vercel automatically
passes it when its daily cron job (6:00 UTC, see `vercel.json`) calls
`/api/clippers/cron`. You can also press **"Refresh views now"** in the
admin dashboard any time.

---

## After deploying

1. Go to `/clippers/signup`, create your account with the admin email.
2. In the admin dashboard set your **RPM** (e.g. $4 per 1K views) and
   **total budget**, tick **Campaign active**, save.
3. Share `courtfuel.app/clippers` with your clippers.

## How the budget cap works

- Videos only earn on **new** views since the last refresh.
- When total accrued earnings reach the budget, earning stops — the final
  accrual is clamped so the total can never exceed the budget.
- Views gained while the budget is empty (or the campaign paused) are
  recorded but **never earn retroactively**. Raise the budget and earning
  resumes from the current view counts.
- "Owed" per clipper = earned − what you've recorded as paid. Pay however
  you like (PayPal etc.) and hit **Mark paid**.
