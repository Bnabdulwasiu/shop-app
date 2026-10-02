import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { getCurrentUser } from "@/lib/orders";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { error, next } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12">
      <div className="rounded-[2rem] bg-surface p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-butter text-lg font-extrabold text-ink">
          S
        </span>

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Log in</h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
          Sign in with Google to save your cart and see your order history. You can also
          check out as a guest.
        </p>

        {error ? (
          <p className="mt-5 rounded-2xl bg-blush px-4 py-3 text-sm font-semibold text-ink">
            {decodeURIComponent(error)}
          </p>
        ) : null}

        <div className="mt-6">
          <GoogleSignInButton next={next ?? "/"} />
        </div>
      </div>

      <p className="mt-5 text-center text-xs font-semibold text-muted">
        Google OAuth is configured in the Google Cloud Console and connected to Supabase
        Auth.
      </p>
    </div>
  );
}