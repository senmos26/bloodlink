import { getCurrentAdminProfile } from "@/features/auth/lib/actions";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const profile = await getCurrentAdminProfile();

  return <NavbarClient profile={profile} />;
}
