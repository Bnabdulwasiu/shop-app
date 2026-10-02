"use client";

import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { useCart } from "@/components/CartProvider";

/** Circular icon link used in the header (matches the moodboard's icon buttons). */
function IconLink({
  label,
  href,
  badge,
  children,
}: {
  label: string;
  href: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f1f3] text-ink transition-colors hover:bg-[#e9e9ec]"
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-butter px-1 text-[11px] font-bold text-ink">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function SiteHeaderClient({ user }: { user: { email: string } | null }) {
  const { count, ready } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-lg font-bold text-butter">
            C
          </span>
          <span className="text-lg font-extrabold tracking-tight">Chemzo Plaza</span>
        </Link>

        {/* Search-style pill — the moodboard's most prominent header element */}
        <div className="hidden flex-1 items-center gap-3 rounded-full bg-white px-5 py-3 md:flex">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0 text-muted"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="What are you looking for?"
            aria-label="Search products"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink sm:inline-flex"
          >
            Shop
          </Link>
          <Link
            href="/orders"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink sm:inline-flex"
          >
            Orders
          </Link>

          <IconLink label="Your cart" href="/cart" badge={ready ? count : 0}>
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2.5 3.5h2.2l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3l1.6-7.4H6" />
            </svg>
          </IconLink>

          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                aria-label={`Sign out ${user.email}`}
                title="Sign out"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-ink-soft"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M15 17l5-5-5-5" />
                  <path d="M20 12H9" />
                  <path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
                </svg>
              </button>
            </form>
          ) : (
            <Link href="/login" className="btn-ink">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}