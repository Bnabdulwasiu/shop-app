-- ============================================================================
-- Shop — Supabase (Postgres) schema
-- Run once in Supabase Dashboard -> SQL Editor -> New query.
-- Safe to re-run (idempotent).
-- ============================================================================

create extension if not exists "pgcrypto";

-- Keep updated_at fresh on any table that has it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency    text not null default 'USD',
  image_url   text,
  category    text,
  stock       integer not null default 0 check (stock >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_active_idx   on public.products (active);
create index if not exists products_category_idx on public.products (category);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Visitors may browse the catalogue without signing in.
drop policy if exists "Active products are publicly readable" on public.products;
create policy "Active products are publicly readable"
  on public.products for select
  using (active = true);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up (e.g. via Google OAuth).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- carts / cart_items  (persisted cart for signed-in users)
-- ---------------------------------------------------------------------------
create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity   integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists "Users manage their own cart" on public.carts;
create policy "Users manage their own cart"
  on public.carts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own cart items" on public.cart_items;
create policy "Users manage their own cart items"
  on public.cart_items for all
  using (
    exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Realtime for cross-device cart sync (Lesson 3 mobile app).
-- Web writes + mobile reads (and vice versa) must arrive instantly, so the
-- cart tables are added to the supabase_realtime publication. The Expo app
-- subscribes with `supabase.channel(...).on('postgres_changes', ...)` and the
-- web CartProvider does the same. Safe to re-run.
-- Run this file (or at least this block) in Supabase SQL Editor.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'carts'
  ) then
    alter publication supabase_realtime add table public.carts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cart_items'
  ) then
    alter publication supabase_realtime add table public.cart_items;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- orders / order_items
-- Written ONLY by the server using the service-role key, so there are no
-- INSERT/UPDATE policies on purpose — RLS blocks all public writes.
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default (
                     'SHOP-' || to_char(now(), 'YYMM') || '-' ||
                     lpad(nextval('public.order_number_seq')::text, 5, '0')
                   ),
  user_id          uuid references auth.users (id) on delete set null,
  email            text not null,
  full_name        text not null,
  phone            text,
  shipping_address text not null,
  city             text,
  state            text,
  postal_code      text,
  country          text,
  subtotal_cents   integer not null check (subtotal_cents >= 0),
  shipping_cents   integer not null default 0 check (shipping_cents >= 0),
  total_cents      integer not null check (total_cents >= 0),
  currency         text not null default 'USD',
  status           text not null default 'pending'
                     check (status in ('pending', 'paid', 'fulfilled', 'cancelled')),
  email_status     text not null default 'pending'
                     check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_user_id_idx    on public.orders (user_id);
create index if not exists orders_email_idx      on public.orders (email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  name             text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity         integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at       timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own order items" on public.order_items;
create policy "Users can view their own order items"
  on public.order_items for select
  using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

grant usage, select on sequence public.order_number_seq to service_role;

-- ---------------------------------------------------------------------------
-- Seed catalogue
-- IDs match src/lib/demo-products.ts so the shop looks identical before and
-- after running this file.
-- ---------------------------------------------------------------------------
insert into public.products
  (id, slug, name, description, price_cents, currency, image_url, category, stock, active)
values
  ('11111111-1111-4111-8111-111111111101', 'indomie-carton-40', 'Indomie Instant Noodles (Carton × 40)',
   'A full carton of 40 packs of Indomie Instant Noodles — Nigeria''s most-loved quick meal. Available in Chicken, Onion Chicken and other classic flavours. Perfect for home, office or resale.',
   850000, 'NGN', 'https://i.etsystatic.com/20760160/r/il/bfd466/3590637582/il_1140xN.3590637582_e3yq.jpg', 'Food & Beverages', 80, true),
  ('11111111-1111-4111-8111-111111111102', 'pepsi-60cl-crate-24', 'Pepsi 60cl × 24 Crate',
   'A chilled crate of 24 Pepsi 60cl bottles — the classic Nigerian party essential. Great for households, events and small businesses. Delivery available within Abuja.',
   600000, 'NGN', 'https://picsum.photos/seed/pepsi-crate/800/800', 'Food & Beverages', 40, true),
  ('11111111-1111-4111-8111-111111111103', 'dettol-soap-6pack', 'Dettol Original Soap (6-pack)',
   'Six bars of Dettol Original antibacterial soap. Trusted for over 80 years to protect against germs. Each bar 75g. Ideal for family use and everyday hygiene in Nigerian homes.',
   420000, 'NGN', 'https://i.pinimg.com/originals/a8/d4/40/a8d440bfced2e16a1e07806a9fe596c9.jpg', 'Toiletries & Personal Care', 60, true),
  ('11111111-1111-4111-8111-111111111104', 'tecno-spark-20', 'Tecno Spark 20',
   'The Tecno Spark 20 features a 6.56" HD+ display, 16MP front camera, 5000mAh battery and runs HiOS on Android. Dual SIM, 4G LTE ready — a solid everyday smartphone at an affordable Naira price.',
   18500000, 'NGN', 'https://d2cdo4blch85n8.cloudfront.net/wp-content/uploads/2024/01/TECNO-SPARK-20-Pro-Android-Smartphone-1568x882.jpg', 'Electronics & Accessories', 10, true),
  ('11111111-1111-4111-8111-111111111105', 'usb-c-braided-cable-2m', 'USB-C Braided Charging Cable (2m)',
   'Heavy-duty 2-metre nylon-braided USB-C to USB-A charging cable. Supports fast charging up to 60W. Compatible with Android phones, tablets and laptops. Tangle-free and built to last.',
   250000, 'NGN', 'https://picsum.photos/seed/usbc-cable/800/800', 'Electronics & Accessories', 50, true),
  ('11111111-1111-4111-8111-111111111106', 'pampers-baby-dry-size3', 'Pampers Baby Dry Diapers (Size 3, 48-pack)',
   'Pampers Baby Dry Size 3 (6–10 kg) in a 48-pack. Up to 12 hours of overnight dryness with 3 layers of absorbency. Soft, stretchy sides for a snug, comfortable fit.',
   1250000, 'NGN', 'https://picsum.photos/seed/pampers-baby-dry/800/800', 'Baby & Kids', 25, true)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, description = excluded.description,
  price_cents = excluded.price_cents, currency = excluded.currency,
  image_url = excluded.image_url, category = excluded.category, stock = excluded.stock;