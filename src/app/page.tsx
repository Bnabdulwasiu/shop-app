import Link from "next/link";
import { ProductBrowser } from "@/components/ProductBrowser";
import { getProducts } from "@/lib/products";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* Hero — "Order From The Best Of Snacks" */}
      <section className="rounded-[2rem] bg-surface p-7 sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="chip">New arrivals every week</span>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Chemzo Plaza{" "}
              <span className="inline-block rounded-2xl bg-butter px-2">Now Online</span>
            </h1>
            <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-muted">
              Your favourite local store — now at your fingertips. Browse our catalogue,
              add to cart and get your order delivered anywhere in Nigeria.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#products" className="btn-ink">
                Shop now
              </Link>
              <Link href="/orders" className="btn-ghost">
                My orders
              </Link>
            </div>
          </div>

          <span
            className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-canvas sm:flex"
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </span>
        </div>
      </section>

      {/* Collections — pastel cards echoing the moodboard */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">Collections</h2>
          <Link
            href="#products"
            className="text-sm font-bold text-muted transition-colors hover:text-ink"
          >
            Browse all &rarr;
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-3xl bg-blush p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
              Fashion &amp; Lifestyle
            </p>
            <h3 className="mt-2 text-2xl font-extrabold leading-tight">
              Style
              <br />
              &amp; Bags
            </h3>
            <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold">
              Clothing &amp; accessories
            </span>
          </article>

          <article className="rounded-3xl bg-mint p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
              Tech &amp; Home
            </p>
            <h3 className="mt-2 text-2xl font-extrabold leading-tight">
              Gadgets
              <br />
              &amp; Essentials
            </h3>
            <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold">
              Electronics &amp; home
            </span>
          </article>
        </div>
      </section>

      {/* Catalogue */}
      <section id="products" className="mt-10 scroll-mt-24">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">All products</h2>
          <span className="text-sm font-semibold text-muted">
            {products.length} item{products.length === 1 ? "" : "s"}
          </span>
        </div>

        {products.length === 0 ? (
          <p className="rounded-3xl bg-surface px-6 py-14 text-center text-sm font-semibold text-muted">
            No products yet. Run <code className="font-mono">supabase/schema.sql</code> to
            seed the catalogue.
          </p>
        ) : (
          <ProductBrowser products={products} />
        )}
      </section>
    </div>
  );
}