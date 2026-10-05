# Chemzo Plaza — Mobile App (Expo Go, Android)

Lesson 3: same account login + instant cart sync with the website.

## Stack

Expo React Native (TypeScript) + `supabase-js`. Calls the SAME Next.js
endpoints the website uses — see `src/lib/api.ts`:

| Feature | Endpoint |
|---|---|
| Catalogue | `GET /api/products` |
| Cart read | `GET /api/cart` (Bearer) |
| Cart write | `PUT /api/cart` (Bearer) |
| Checkout | `POST /api/checkout` (Bearer) |
| Orders | `GET /api/orders` (Bearer) |

Web auth is cookie-based; mobile has no cookies so it sends
`Authorization: Bearer <supabase_access_token>` — accepted by
`src/lib/supabase/api-auth.ts` (`getApiSupabase`). Same Supabase project =
same `auth.users` = same account on both.

Instant sync: both web (`CartProvider`) and mobile (`CartContext`) subscribe
to Realtime `postgres_changes` on `cart_items`/`carts` (+15s poll fallback).
Run `supabase/schema.sql` (Realtime block) in Supabase SQL Editor once.

## Setup (5 min)

1. `cd mobile && cp .env.example .env` and fill in:
   - `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` — same as web `.env.local`
   - `EXPO_PUBLIC_API_URL` — your **deployed** URL (phone can't reach localhost),
     e.g. `https://shop-app-kappa-coral.vercel.app`
2. `npm install`
3. `npx expo start` — scan the QR with **Expo Go** on your Android phone.
   Laptop + phone must be on the same Wi-Fi (or use `--tunnel`).

## Supabase checklist (once)

- Auth → Providers → Google: enabled (same client as web).
- Auth → URL Configuration → Redirect URLs: add `chemzoplaza://` (mobile
  scheme in `app.json`) alongside the web `.../auth/v1/callback`.
- While the Google consent screen is in Testing: add your phone's Google
  account under Test users, or use the email fallback on the login screen
  (same Supabase Auth user — still proves "same account").
- Database → Replication: `supabase_realtime` ON for `carts` + `cart_items`
  (or just re-run `supabase/schema.sql`).

## Physical-device test (for submission)

1. Open Expo Go → log in on the phone (Google or email). Note the email.
2. On the laptop website, log in with the SAME account.
3. On the website, add "Indomie Instant Noodles (Carton × 40)" to cart.
4. Watch the phone cart — the item appears within ~2s, no manual refresh
   (green "Synced with website" bar updates). Screen-record this.
5. Reverse: add Pepsi crate on the phone → refresh website cart → it shows.
6. Evidence: screen recording + screenshots of both showing the same
   account + matching cart items.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Phone cart empty / 401 | Token expired — log out/in. Check `EXPO_PUBLIC_API_URL` is the deployed URL, not localhost. |
| Google redirect dies | Add `chemzoplaza://` to Supabase redirect URLs. |
| No instant update | Enable Realtime on the two tables; 15s poll fallback still syncs. |
| Products fail to load | Deploy web first (`/api/products`), check phone has internet. |
