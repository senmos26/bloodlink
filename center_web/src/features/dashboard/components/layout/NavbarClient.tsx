"use client";

import { Menu } from "lucide-react"; // Import Menu icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { signOut } from "@/features/auth/lib/actions";
import { Settings, LogOut } from "lucide-react";
import { useLayout } from "../../lib/LayoutContext";

import Image from "next/image";
import { useRef } from "react";
import { GlobalLanguageSelector } from "@/shared/components/GlobalLanguageSelector";
import { useLocale, useTranslations } from "next-intl";
import { NotificationDropdown } from "@/features/notifications/components/NotificationDropdown";

interface ProfileLite {
  full_name: string | null;
  avatar_url: string | null;
  role: "donor" | "center_admin" | "super_admin" | null;
}

export function NavbarClient({ profile }: { profile: ProfileLite | null }) {
  const t = useTranslations("common.navigation.account");
  const { toggleMobileSidebar } = useLayout();
  const locale = useLocale();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fullName = profile?.full_name || "User";

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center w-full min-w-0">
      {/* Section gauche - Menu mobile et recherche */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile hamburger menu icon */}
        <button
          type="button"
          className="p-2 rounded hover:bg-light transition-colors lg:hidden"
          aria-label="Ouvrir le menu"
          onClick={toggleMobileSidebar}
        >
          <Menu className="size-5" />
        </button>

        <div className="hidden md:block w-full max-w-md" ref={searchContainerRef} />
      </div>

      {/* Section droite - Notifications et profil */}
      <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-4">
        {/* Language Switcher - Visible on all screens */}
        <GlobalLanguageSelector />

        {/* Notifications dropdown */}
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger className="group flex items-center gap-2 sm:gap-3 cursor-pointer rounded-md p-1 hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50">
            {/* Avatar personnalisé avec style circulaire */}
            <div className="relative size-8 group-avatar flex items-center justify-center">
              {/* Cercle décoratif */}
              <div className="absolute inset-0 rounded-full ring-1 ring-offset-1 ring-primary/10"></div>

              {/* Image + overlay avec clip circulaire */}
              <div
                className="relative size-8"
                style={{
                  clipPath: "circle(50% at 50% 50%)",
                  borderRadius: "50%",
                }}
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={fullName}
                    fill
                    priority
                    unoptimized
                    className="object-cover transition-all duration-300 group-hover:opacity-90 group-hover:scale-105"
                    suppressHydrationWarning
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary text-xs font-medium transition-all duration-300 group-hover:from-primary/30 group-hover:to-primary/50">
                    {initials}
                  </div>
                )}
              </div>
            </div>
            <div className="hidden xs:flex sm:flex flex-col leading-tight text-left">
              <span className="text-sm text-primary max-w-[160px] truncate group-hover:text-primary transition-colors">
                {fullName || "Invité"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/settings`} className="flex items-center gap-2">
                <Settings className="size-4" />
                <span>{t("settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="w-full text-left flex items-center gap-2"
                >
                  <LogOut className="size-4" />
                  <span>{t("logout")}</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
