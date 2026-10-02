import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 px-4 pb-10">
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-ink px-8 py-10 text-white">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-butter text-lg font-bold text-ink">
                C
              </span>
              <span className="text-lg font-extrabold tracking-tight">Chemzo Plaza</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-white/60">
              Your trusted local store, now online. General merchandise delivered
              across Nigeria. Built with Next.js &amp; Supabase.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              Shop
            </Link>
            <Link
              href="/cart"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              Cart
            </Link>
            <Link
              href="/orders"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              Orders
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-xs text-white/40">
          Demo storefront &middot; payments are simulated for this task.
        </p>
      </div>
    </footer>
  );
}