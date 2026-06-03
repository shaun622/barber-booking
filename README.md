# Balis Barber — Booking App

Self-hosted booking app that replaces Fresha for [balisbarber.com](https://balisbarber.com).
SvelteKit + Cloudflare (Pages + Workers + D1 + KV).

The WordPress site stays on Hostinger, untouched — this app lives at `booking.balisbarber.com`
and is linked from the existing "Book Now" buttons.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend / SSR | SvelteKit 2 + Svelte 5 + Tailwind 4 |
| Hosting | Cloudflare Pages (build), Cloudflare Workers (runtime) |
| Database | Cloudflare D1 (SQLite) |
| KV | Rate-limit + slot-lock |
| Anti-spam | Cloudflare Turnstile |
| Email | Resend |
| WhatsApp notifications | Meta WhatsApp Cloud API |

Cost target: **$0/month** within free tiers.

---

## Local development

```bash
npm install
cp .env.example .dev.vars   # fill in secrets you have; rest can stay blank
npm run dev                 # http://localhost:5173
```

Local D1 lives in `.wrangler/state/`. First time:

```bash
npm run db:local:migrate
npm run db:local:seed
```

Then `npm run dev` works against the local SQLite database.

For Pages-realistic preview (Workers runtime, KV, D1):

```bash
npm run build
npm run preview             # uses `wrangler pages dev`
```

---

## First-time Cloudflare setup

You need a Cloudflare account. Tools:

```bash
npm install -g wrangler     # or use `npx wrangler` everywhere
wrangler login
```

### 1. Create D1 database

```bash
wrangler d1 create balis_barber
```

Copy the `database_id` it prints into `wrangler.toml` under the `[[d1_databases]]` block (replace `REPLACE_WITH_DB_ID_AFTER_wrangler_d1_create`).

### 2. Create KV namespaces

```bash
wrangler kv namespace create RATE_LIMIT
wrangler kv namespace create SLOT_LOCKS
```

Copy each `id` into `wrangler.toml` under the matching `[[kv_namespaces]]` block.

### 3. Apply migrations + seed

```bash
npm run db:remote:migrate
npm run db:remote:seed
```

### 4. Create Pages project

Connect this repo (`shaun622/barber-booking`) at Cloudflare Pages → **Create project → Connect to Git**.

- Build command: `npm run build`
- Build output directory: `.svelte-kit/cloudflare`
- Root directory: (leave blank)
- Environment: Production

The first deploy will fail until secrets are set — do step 5 first, then redeploy.

### 5. Set Pages secrets

In the Pages project → **Settings → Environment variables**, add these as **secret** (encrypted):

| Name | Value | How to get |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | bcrypt hash | `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"` |
| `SESSION_SECRET` | random 32+ char string | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `TURNSTILE_SECRET` | from Turnstile dashboard | https://dash.cloudflare.com → Turnstile → Add site (Invisible mode) |
| `RESEND_API_KEY` | from resend.com | https://resend.com → API Keys (free tier 3k emails/mo) |
| `WHATSAPP_TOKEN` | Meta long-lived token | https://developers.facebook.com → WhatsApp Cloud API |
| `WHATSAPP_PHONE_ID` | Meta phone-number ID | same dashboard |

And as **plaintext** (public, ships to client):

| Name | Value |
|---|---|
| `TURNSTILE_SITE_KEY` | from Turnstile dashboard |

The `[vars]` block in `wrangler.toml` covers the non-secret defaults (shop timezone, owner email, owner WhatsApp number). Edit those if needed and commit.

### 6. Bind D1 + KV to the Pages project

In the Pages project → **Settings → Functions**:

- Add D1 binding: `DB` → `balis_barber`
- Add KV binding: `RATE_LIMIT` → the namespace you created
- Add KV binding: `SLOT_LOCKS` → the namespace you created

These are separate from `wrangler.toml`'s versions (which are only for local dev). The dashboard bindings are what production uses.

### 7. Custom domain — `booking.balisbarber.com`

In Pages → **Custom domains → Set up a custom domain → `booking.balisbarber.com`**.

Cloudflare will tell you to add a CNAME at your DNS provider. Hostinger DNS stays where it is; just add this **one record** in Hostinger's DNS manager:

```
Type: CNAME
Name: booking
Value: <your-pages-project>.pages.dev
TTL: Auto
```

Cloudflare may also ask for a TXT record for ACME validation — add that too if it does. SSL cert auto-issues in a few minutes.

**Nothing else at Hostinger changes.** The WordPress A record, MX records, www, mail — all stay.

---

## WordPress / Elementor cutover (done in WP-Admin, not here)

Once `booking.balisbarber.com` is live and tested:

1. In Elementor, edit each "Book Now" / "Make Appointment" button: replace the Fresha URL with `https://booking.balisbarber.com`.
2. (Optional) Create a new Elementor page at `/booking` that contains a single Iframe widget pointing at `https://booking.balisbarber.com` with `100vh` height and `100%` width. Both URLs then work.
3. Delete the "Classic Haircut — IDR 120,000" line from the services list — it's no longer offered.
4. Leave the Fresha link in the page footer for 2 weeks as a fallback. After 2 weeks of clean operation, remove it and cancel Fresha.

---

## Project structure

```
src/
├─ routes/
│  ├─ +layout.{server.ts,svelte}  EN/ID, Tailwind shell
│  ├─ +page.svelte                home (category picker)
│  ├─ service/                    pick service
│  ├─ addons/                     pick add-ons (skipped for On-Call)
│  ├─ barber/                     pick specific or "Any"
│  ├─ time/                       date + time slot
│  ├─ details/                    name + WhatsApp + (address) + Turnstile
│  ├─ confirm/                    success page
│  ├─ admin/                      password-gated owner panel
│  └─ api/
│     ├─ flow/                    flow-state cookie writes
│     ├─ availability/            POST → slot list
│     └─ bookings/                POST create + notify
└─ lib/
   ├─ db.ts                       D1 helpers + types
   ├─ time.ts                     WITA helpers
   ├─ availability.ts             slot computation
   ├─ notify.ts                   email + WhatsApp
   ├─ flow.ts                     in-progress booking cookie
   ├─ rateLimit.ts                KV-based rate limit + slot lock
   ├─ admin.ts                    password check + signed session
   └─ i18n/{en,id}.json           translations
migrations/
   ├─ 0001_init.sql               schema
   └─ 0002_seed.sql               services + barbers + hours
```

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (no D1 — uses local SQLite via wrangler if migrated) |
| `npm run check` | TypeScript + Svelte type check |
| `npm run build` | Production build to `.svelte-kit/cloudflare/` |
| `npm run preview` | Local preview with Wrangler (closer to prod) |
| `npm run deploy` | Build + deploy to Pages (after `wrangler login`) |
| `npm run db:local:migrate` | Apply migrations to local D1 |
| `npm run db:remote:migrate` | Apply migrations to production D1 |
| `npm run db:local:seed` | Re-seed local D1 from migrations/0002_seed.sql |
| `npm run db:remote:seed` | Re-seed production D1 (DANGER: deletes services/barbers first) |

---

## Editing the service catalog

Two ways:

- **Permanent change:** edit `migrations/0002_seed.sql` and re-run `npm run db:remote:seed`. Use this for adding new services or fixing typos.
- **Live admin tweak:** not yet built. The `/admin/services` page is stubbed in the plan but not implemented in this initial cut. Use the seed file for now; admin edits are a follow-up.

---

## Verification checklist before cutting Fresha

- [ ] `booking.balisbarber.com` resolves over HTTPS.
- [ ] Original balisbarber.com still loads; WP admin works; email still delivers.
- [ ] Pick each category → service → (add-ons) → barber → time → submit → see confirmation.
- [ ] Booking appears immediately in `/admin`.
- [ ] Owner receives email + WhatsApp notification within seconds.
- [ ] `wa.me` deeplink in the notification opens WhatsApp with prefilled text to the customer.
- [ ] Two browsers try the same slot within 5 min — second is rejected with "slot just taken".
- [ ] Submit without Turnstile / with garbage phone — rejected.
- [ ] Toggle EN ↔ ID — all strings switch.
- [ ] Block a slot in `/admin/blocks` — disappears from customer availability.
- [ ] On-Call service requires address and adds 30-min travel buffer to following slots.
- [ ] Iframe at `balisbarber.com/booking` works on mobile Safari and Chrome Android.

---

## Notes

- Shop timezone is hardcoded as `Asia/Makassar` (+08:00, no DST). All times stored as ISO strings with `+08:00`.
- Bcrypt is used for the admin password hash via `bcryptjs` (pure JS, runs on Workers).
- The customer's flow-state lives in a single cookie (`flow`) for 30 min — cleared on success.
- KV slot-lock holds for 10 min after a slot is reserved at the `/details` step; this prevents double-booking races.
- Per-IP rate limit: 6 booking attempts per minute via KV.
