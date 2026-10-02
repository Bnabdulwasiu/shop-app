import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Order From The <span className="rounded-2xl bg-butter px-2">Best Of Snacks</span>
      </h1>
      <CartView />
    </div>
  );
}