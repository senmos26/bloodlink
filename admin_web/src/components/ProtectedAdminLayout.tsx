"use client";
import Image from "next/image";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCurrentAdminContext, signOut, type AdminContext } from "@/lib/auth";

type ProtectedAdminLayoutProps = {
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
  { href: "/admin/centers", label: "Centres de santé", icon: <HospitalIcon /> },
  { href: "/admin/profiles", label: "Donneurs / Profils", icon: <UsersIcon /> },
  { href: "/admin/alerts", label: "Alertes d'urgence", icon: <AlertIcon /> },
  { href: "/admin/appointments", label: "Rendez-vous", icon: <CalendarIcon /> },
  { href: "/admin/donations", label: "Dons", icon: <DropIcon /> },
  { href: "/admin/notifications", label: "Notifications", icon: <BellIcon /> },
  { href: "/admin/statistics", label: "Statistiques", icon: <ChartIcon /> },
];

export default function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
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

        if (!active) {
          return;
        }

        setContext(adminContext);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }

        const message =
          err instanceof Error ? err.message : "Accès non autorisé.";

        setContext(null);
        setError(message);
        router.replace(`/login?error=${encodeURIComponent(message)}`);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContext();

    return () => {
      active = false;
    };
  }, [router]);

  const navItems = useMemo(() => {
    if (!context) {
      return [];
    }

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm">
          Vérification de votre accès administrateur...
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-slate-900/90 p-6 text-center shadow-2xl">
          <p className="text-lg font-semibold text-red-300">Accès refusé</p>
          <p className="mt-2 text-sm text-slate-300">
            {error ?? "Redirection vers la page de connexion."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="flex w-72 flex-col bg-slate-950 text-white">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg shadow-red-950/20">
              <Image
                src="/logo.png"
                alt="BloodLink Logo"
                width={42}
                height={42}
                className="object-contain"
              />
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Administration</h1>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-medium text-white">
                {context.profile.full_name}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {context.user.email}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-300">
                {context.role === "super_admin"
                  ? "Super Admin"
                  : "Centre Admin"}
              </p>
              {context.center ? (
                <p className="mt-2 text-sm text-slate-200">
                  {context.center.name}
                </p>
              ) : null}
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-4 py-3 text-sm transition ${
                      active
                        ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                        : "text-slate-200 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-red-50"
            >
              Déconnexion
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-white">
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
