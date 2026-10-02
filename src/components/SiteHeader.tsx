import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { getCurrentUser } from "@/lib/orders";

/** Server shell: resolves the signed-in user, then hands off to the client header. */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return <SiteHeaderClient user={user ? { email: user.email ?? "" } : null} />;
}