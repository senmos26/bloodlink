"use client";
import Image from "next/image";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCurrentAdminContext, signOut, type AdminContext } from "@/lib/auth";

type ProtectedAdminShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const centerAdminLinks: NavItem[] = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: <DashboardIcon /> },
  { href: "/admin/alerts", label: "Alertes d'urgence", icon: <AlertIcon /> },
  { href: "/admin/appointments", label: "Rendez-vous", icon: <CalendarIcon /> },
  { href: "/admin/donations", label: "Dons", icon: <DropIcon /> },
  { href: "/admin/notifications", label: "Notifications", icon: <BellIcon /> },
  { href: "/admin/statistics", label: "Statistiques", icon: <ChartIcon /> },
];

const superAdminLinks: NavItem[] = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: <DashboardIcon /> },
  { href: "/admin/alerts", label: "Alertes d'urgence", icon: <AlertIcon /> },
  { href: "/admin/appointments", label: "Rendez-vous", icon: <CalendarIcon /> },
  { href: "/admin/profiles", label: "Donneurs / Profils", icon: <UsersIcon /> },
  { href: "/admin/centers", label: "Centres de santé", icon: <HospitalIcon /> },
  { href: "/admin/donations", label: "Dons", icon: <DropIcon /> },
  { href: "/admin/notifications", label: "Notifications", icon: <BellIcon /> },
  { href: "/admin/statistics", label: "Statistiques", icon: <ChartIcon /> },
];

export default function ProtectedAdminShell({
  children,
}: ProtectedAdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [context, setContext] = useState<AdminContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadContext() {
      try {
        const adminContext = await getCurrentAdminContext();
        if (!active) return;
        setContext(adminContext);
        setError(null);
      } catch (err) {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Accès non autorisé.";
        setContext(null);
        setError(message);
        router.replace(`/login?error=${encodeURIComponent(message)}`);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContext();

    return () => {
      active = false;
    };
  }, [router]);

  const navItems = useMemo(() => {
    if (!context) return [];
    return context.role === "super_admin" ? superAdminLinks : centerAdminLinks;
  }, [context]);

  async function handleLogout() {
    try {
      await signOut();
    } finally {
      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1420] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm">
          Vérification de votre accès administrateur...
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1420] px-4 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-[#151b28] p-6 text-center shadow-2xl">
          <p className="text-lg font-semibold text-red-300">Accès refusé</p>
          <p className="mt-2 text-sm text-slate-300">
            {error ?? "Redirection vers la page de connexion."}
          </p>
        </div>
      </div>
    );
  }

  const initials = context.profile.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="min-h-screen lg:pl-72">
        <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col overflow-hidden bg-[#151b28] text-white lg:flex">
          <div className="shrink-0 border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-4">
              <Image
                             src="/logo.png"
                             alt="BloodLink Logo"
                             width={70}
                             height={70}
                             className="object-contain"
                             priority
                           />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-300">
                  BloodLink
                </p>
                <h1 className="mt-1 text-2xl font-semibold">Admin Panel</h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="shrink-0 border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-red-200">
                  {initials || "BL"}
                </div>
                <div className="min-w-0 flex-1">
                  
                  <p className="truncate text-xs text-slate-300">{context.user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-white/10 p-2 text-slate-200 transition hover:bg-red-500 hover:text-white"
                  aria-label="Déconnexion"
                >
                  <LogoutIcon />
                </button>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-300">
                {context.role === "super_admin" ? "Super Admin" : "Centre Admin"}
              </p>
              {context.center ? (
                <p className="mt-1 text-sm text-slate-300">{context.center.name}</p>
              ) : null}
            </div>
          </div>
        </aside>

        <main className="min-h-screen bg-slate-100">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between px-6 py-4 md:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
                  BloodLink
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Interface de supervision en temps réel
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <button type="button" className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-slate-900" aria-label="Notifications">
                  <BellIcon />
                </button>
                <button type="button" className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-slate-900" aria-label="Paramètres">
                  <SettingsIcon />
                </button>
              </div>
            </div>
          </header>
          <div className="min-h-screen p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function baseIcon(children: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return baseIcon(<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" />);
}

function AlertIcon() {
  return baseIcon(<path d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />);
}

function CalendarIcon() {
  return baseIcon(<path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />);
}

function DropIcon() {
  return baseIcon(<path d="M12 2s6 6.1 6 11a6 6 0 0 1-12 0c0-4.9 6-11 6-11Z" />);
}

function BellIcon() {
  return baseIcon(<path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m2 0v1a1 1 0 1 0 2 0v-1m-2 0h2" />);
}

function ChartIcon() {
  return baseIcon(<path d="M4 19V5m0 14h16M8 17V9m4 8V5m4 12v-6" />);
}

function UsersIcon() {
  return baseIcon(<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />);
}

function HospitalIcon() {
  return baseIcon(<path d="M4 21V7a2 2 0 0 1 2-2h4V3h4v2h4a2 2 0 0 1 2 2v14M9 21v-4h6v4M10 9h4m-2-2v4" />);
}

function SettingsIcon() {
  return baseIcon(<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm7.4-3.5.6-.3a1 1 0 0 0 0-1.8l-1.3-.6a7.8 7.8 0 0 0-.7-1.6l.5-1.4a1 1 0 0 0-.5-1.2l-1.6-.9a1 1 0 0 0-1.2.2L13.3 5a7.8 7.8 0 0 0-1.7 0l-.9-1.2a1 1 0 0 0-1.2-.2l-1.6.9a1 1 0 0 0-.5 1.2l.5 1.4a7.8 7.8 0 0 0-.7 1.6l-1.3.6a1 1 0 0 0 0 1.8l1.3.6c.2.6.4 1.1.7 1.6l-.5 1.4a1 1 0 0 0 .5 1.2l1.6.9a1 1 0 0 0 1.2-.2l.9-1.2c.6.1 1.1.1 1.7 0l.9 1.2a1 1 0 0 0 1.2.2l1.6-.9a1 1 0 0 0 .5-1.2l-.5-1.4c.3-.5.5-1 .7-1.6l1.3-.6Z" />);
}

function LogoutIcon() {
  return baseIcon(<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5M21 12H9" />);
}
