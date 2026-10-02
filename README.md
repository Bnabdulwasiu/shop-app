# Shop — Next.js + Supabase + Mailgun

A small but complete storefront built for the HNG task.

| Requirement | Where it lives |
| --- | --- |
| Shop website | `/`, `/products/[slug]`, `/cart` |
| Checkout page | `/checkout` → `POST /api/checkout` → `/checkout/success` |
| Persist everything in a database (Supabase/Neon) | `supabase/schema.sql` + `src/lib/supabase/*` |
| Confirmation emails via Resend | `src/lib/email.ts`, called from `/api/checkout` |
| Google auth via Google Cloud Console | `/login` → Supabase Auth Google provider → `/auth/callback` |

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres + Auth) · Mailgun.

---

## Features

- **Catalogue** — products come from the `products` table. If Supabase is not
  configured yet, the app falls back to a bundled demo catalogue so the shop
  always renders.
- **Cart** — guests get a `localStorage` cart; when signed in the cart is
  persisted to `carts` / `cart_items` and merged with the local one.
- **Checkout** — server-side re-pricing (client prices are never trusted), stock
  checks, order + order-item persistence via the service-role key.
- **Emails** — a responsive HTML order confirmation sent through Mailgun, with
  the delivery status stored on the order (`email_status`).
- **Google sign-in** — an OAuth 2.0 client created in Google Cloud Console and
  wired to Supabase Auth. Sessions are refreshed in `src/proxy.ts`.
- **Order history** — signed-in users see their orders at `/orders`.
- **Security** — Row Level Security on every table; `orders` / `order_items`
  have no public write policy, so only the server (service role) can create them.

---

## Prerequisites

- Node.js 20.9+ (developed on Node 24)
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [Mailgun](https://www.mailgun.com) account
- A [Google Cloud Console](https://console.cloud.google.com) project

## 1. Set up the database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
   This creates `products`, `profiles`, `carts`, `cart_items`, `orders`,
   `order_items`, every RLS policy, the new-user trigger, and seeds 6 products.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (older projects: **anon public**) →
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Secret key** (older projects: **service_role**) →
     `SUPABASE_SERVICE_ROLE_KEY` — server only, never expose or commit it

   > The newer `sb_publishable_...` / `sb_secret_...` keys work exactly like the
   > classic anon / service_role keys, so either format is fine.

> Prefer Neon? The schema is portable Postgres — run it in a Neon SQL editor,
> drop the `auth.users` foreign keys, and replace the Supabase clients in
> `src/lib/supabase/*` with a `pg` pool. Supabase is used here because it also
> provides Auth, which keeps the Google login setup to a single provider config.

## 2. Create the Google OAuth client (Google Cloud Console)

1. Go to **console.cloud.google.com → APIs & Services → OAuth consent screen**.
   - User type: **External**
   - Fill in the app name, support email and developer contact email
   - Add your own Google account under **Test users** (required while the app is
     in "Testing" status)
2. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**
   - **Authorised JavaScript origins**
     - `http://localhost:3000`
   - **Authorised redirect URIs**
     - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback`
3. Click **Create** and copy the **Client ID** and **Client secret**.
4. In Supabase: **Authentication → Providers → Google** → enable it, paste the
   Client ID and Client secret, and save.
5. In Supabase: **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/auth/callback`

That's the whole Google login requirement: the credential is created in Google
Cloud Console and consumed by Supabase Auth.

## 3. Set up Resend

1. Create a free account at [resend.com](https://resend.com).
2. Go to **API Keys → Create API Key** and copy the key (starts with `re_`).
3. By default emails are sent from `onboarding@resend.dev` and delivered only to
   your own Resend account email — perfect for testing.
4. To send to **any** address, add and verify a domain under **Domains** and set
   `RESEND_FROM=Shop <orders@yourdomain.com>` in `.env.local`.

## 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Optional — defaults to onboarding@resend.dev (delivers to your Resend account email only)
RESEND_FROM=Shop <onboarding@resend.dev>
```

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
```

### Try the flow

1. Open `/` and add a couple of products to the cart.
2. Go to `/cart` and adjust quantities.
3. Open `/login` and sign in with Google (your cart is merged into the DB).
4. Go to `/checkout`, fill in the form and **Place order**.
5. You land on `/checkout/success` and the Mailgun confirmation arrives.
6. `/orders` shows the order, and Supabase **Table Editor** shows the rows in
   `orders` and `order_items` — that's the persistence proof.

---

## Project structure

```
supabase/schema.sql            Tables, RLS, triggers, seed data
src/proxy.ts                   Next 16 Proxy (Middleware) — refreshes the auth session
src/app/
  page.tsx                     Shop / catalogue
  products/[slug]/page.tsx     Product detail
  cart/page.tsx                Cart
  checkout/page.tsx            Checkout (server) -> CheckoutForm (client)
  checkout/success/page.tsx    Order receipt
  orders/page.tsx              Order history
  login/page.tsx               Google sign-in
  auth/callback/route.ts       OAuth code -> session exchange
  actions/auth.ts              signOut server action
  api/cart/route.ts            GET/PUT the persisted cart
  api/checkout/route.ts        Validate -> persist order -> send email
src/components/                Header, footer, cart, product, checkout UI
src/lib/
  supabase/{config,client,server,admin}.ts   Supabase clients
  email.ts                     Resend client + HTML email template
  products.ts, orders.ts       Data access
  money.ts, validation.ts      Helpers
```

---

## How the checkout works

1. `CheckoutForm` posts `{ items: [{ productId, quantity }], customer }` to
   `/api/checkout` — **no prices are sent**.
2. The route validates the payload (`src/lib/validation.ts`).
3. Prices, stock and currency are read back from `products`, so totals can't be
   tampered with. Items that are missing or out of stock produce a `409`.
4. The order and its items are inserted with the **service-role** key (RLS blocks
   direct public writes to `orders`).
5. Stock is decremented (best effort) and the Mailgun email is sent; the result
   is stored in `orders.email_status`.
6. An `httpOnly` cookie remembers the order number so the success page can show
   the receipt without exposing orders to URL guessing.

## Notes & limitations

- **Payments are simulated.** There is no payment gateway; orders are created
  with `status = 'paid'`. Add Stripe/Paystack at step 4 above when needed.
- **Stock updates are not atomic.** For a real store, move the stock decrement
  into a Postgres function / transaction.
- **The cart is a client-side first design.** Guests use `localStorage`; the DB
  cart is a sync target for signed-in users, which is enough for this task.
- **Design language is centralised in `globals.css`.** All colours, radii and
  component utilities (`.chip`, `.btn-ink`, `.btn-butter`, `.panel-ink`,
  `.field`, `.price-pill`, `.stepper`) live in one `@theme` + `@utility` block,
  so the whole storefront can be re-skinned without touching layout code.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Checkout returns **503** | `SUPABASE_SERVICE_ROLE_KEY` (or the URL/anon key) is missing from `.env.local`, or `supabase/schema.sql` hasn't been run. |
| `redirect_uri_mismatch` from Google | The redirect URI in Google Cloud Console must be exactly `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`. |
| Emails not arriving | Check the **Logs** tab in Resend. With `onboarding@resend.dev`, emails only deliver to your own Resend account email. Add a verified domain to send to any address. |
| `email_status = failed` on an order | `RESEND_API_KEY` is wrong or missing from `.env.local`. |
| Empty catalogue | Run `supabase/schema.sql` (it seeds products), or keep the demo fallback. |