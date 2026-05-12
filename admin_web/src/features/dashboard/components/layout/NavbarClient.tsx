"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useLayout } from "@/features/dashboard/lib/LayoutContext";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { NotificationPanel } from "@/features/notifications/components/NotificationPanel";

interface NavbarClientProps {
  profile: Profile | null;
}

export function NavbarClient({ profile }: NavbarClientProps) {
  const { toggleMobileSidebar } = useLayout();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-600">
              BloodLink Admin
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              Interface de supervision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search (placeholder) */}
          <button
            type="button"
            className="hidden sm:flex rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-slate-900"
            aria-label="Rechercher"
          >
            <Search className="size-4" />
          </button>

          {/* Notifications */}
          <NotificationPanel />

          {/* User info */}
          {profile && (
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-xs font-bold text-rose-600">
                {profile.full_name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{profile.full_name}</p>
                <p className="text-[10px] uppercase tracking-widest text-rose-600 font-bold">Super Admin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
