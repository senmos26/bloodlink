"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  AdminThemeContext,
  type AdminTheme,
} from "@/components/AdminThemeContext";
import { getCurrentAdminContext, signOut, type AdminContext } from "@/lib/auth";

type EnhancedAdminShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const centerAdminLinks: NavItem[] = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: <DashboardIcon /> },
  { href: "/admin/account", label: "Mon profil", icon: <ProfileIcon /> },
  { href: "/admin/alerts", label: "Alertes d'urgence", icon: <AlertIcon /> },
  { href: "/admin/appointments", label: "Rendez-vous", icon: <CalendarIcon /> },
  { href: "/admin/donations", label: "Dons", icon: <DropIcon /> },
  { href: "/admin/notifications", label: "Notifications", icon: <BellIcon /> },
  { href: "/admin/statistics", label: "Statistiques", icon: <ChartIcon /> },
];

const superAdminLinks: NavItem[] = [
  { href: "/admin/dashboard", label: "Tableau de bord", icon: <DashboardIcon /> },
  { href: "/admin/account", label: "Mon profil", icon: <ProfileIcon /> },
  { href: "/admin/alerts", label: "Alertes d'urgence", icon: <AlertIcon /> },
  { href: "/admin/appointments", label: "Rendez-vous", icon: <CalendarIcon /> },
  { href: "/admin/profiles", label: "Donneurs / Profils", icon: <UsersIcon /> },
  { href: "/admin/centers", label: "Centres de santé", icon: <HospitalIcon /> },
  { href: "/admin/donations", label: "Dons", icon: <DropIcon /> },
  { href: "/admin/notifications", label: "Notifications", icon: <BellIcon /> },
  { href: "/admin/statistics", label: "Statistiques", icon: <ChartIcon /> },
];

export default function EnhancedAdminShell({
  children,
}: EnhancedAdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [context, setContext] = useState<AdminContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<AdminTheme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const savedTheme = window.localStorage.getItem("admin-theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("admin-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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
      } catch (loadError) {
        if (!active) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Accès non autorisé.";

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

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  const shellBackground =
    theme === "dark"
      ? "bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100"
      : "bg-[linear-gradient(180deg,#eff6ff_0%,#f8fafc_100%)] text-slate-900";
  const sidebarClasses =
    theme === "dark"
      ? "fixed left-0 top-0 hidden h-screen w-72 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-white lg:flex"
      : "fixed left-0 top-0 hidden h-screen w-72 flex-col overflow-hidden border-r border-sky-100 bg-[linear-gradient(180deg,#e0f2fe_0%,#f8fafc_100%)] text-slate-900 lg:flex";
  const headerClasses =
    theme === "dark"
      ? "sticky top-0 z-10 border-b border-slate-800 bg-slate-950/85 backdrop-blur"
      : "sticky top-0 z-10 border-b border-sky-100 bg-white/80 backdrop-blur";
  const panelClasses =
    theme === "dark"
      ? "rounded-2xl bg-white/5 p-4"
      : "rounded-2xl border border-sky-100 bg-white/70 p-4";
  const subtleText = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const secondaryText = theme === "dark" ? "text-slate-300" : "text-slate-600";

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${shellBackground}`}>
        <div
          className={`rounded-3xl px-6 py-5 text-sm ${
            theme === "dark"
              ? "border border-white/10 bg-white/5"
              : "border border-sky-100 bg-white shadow-sm"
          }`}
        >
          Vérification de votre accès administrateur...
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 ${shellBackground}`}>
        <div
          className={`max-w-md rounded-3xl p-6 text-center shadow-2xl ${
            theme === "dark"
              ? "border border-red-500/30 bg-slate-900"
              : "border border-red-200 bg-white"
          }`}
        >
          <p className="text-lg font-semibold text-red-500">Accès refusé</p>
          <p className={`mt-2 text-sm ${secondaryText}`}>
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
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen ${shellBackground}`}>
        <div className="min-h-screen lg:pl-72">
          <aside className={sidebarClasses}>
            <div
              className={`shrink-0 px-6 py-6 ${
                theme === "dark" ? "border-b border-white/10" : "border-b border-sky-100"
              }`}
            >
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">
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
                          ? "bg-red-600 text-white shadow-lg shadow-red-950/20"
                          : theme === "dark"
                            ? "text-slate-200 hover:bg-white/10 hover:text-white"
                            : "text-slate-700 hover:bg-white/90 hover:text-slate-950"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div
              className={`shrink-0 p-4 ${
                theme === "dark" ? "border-t border-white/10" : "border-t border-sky-100"
              }`}
            >
              <div className={panelClasses}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold ${
                      theme === "dark"
                        ? "bg-white/10 text-red-200"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {initials || "BL"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {context.profile.full_name}
                    </p>
                    <p className={`truncate text-xs ${subtleText}`}>
                      {context.user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`rounded-xl p-2 transition ${
                      theme === "dark"
                        ? "bg-white/10 text-slate-200 hover:bg-red-500 hover:text-white"
                        : "bg-white text-slate-500 shadow-sm hover:bg-red-500 hover:text-white"
                    }`}
                    aria-label="Déconnexion"
                  >
                    <LogoutIcon />
                  </button>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-red-500">
                  {context.role === "super_admin" ? "Super Admin" : "Centre Admin"}
                </p>
                {context.center ? (
                  <p className={`mt-1 text-sm ${secondaryText}`}>{context.center.name}</p>
                ) : null}
              </div>
            </div>
          </aside>

          <main className="min-h-screen">
            <header className={headerClasses}>
              <div className="flex items-center justify-between px-6 py-4 md:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">
                    BloodLink
                  </p>
                  <p className={`mt-1 text-sm ${subtleText}`}>
                    Interface de supervision en temps réel
                  </p>
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  <button
                    type="button"
                    className={`rounded-2xl p-3 transition ${
                      theme === "dark"
                        ? "border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                    }`}
                    aria-label="Notifications"
                  >
                    <BellIcon />
                  </button>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`rounded-2xl p-3 transition ${
                      theme === "dark"
                        ? "border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                    }`}
                    aria-label={
                      theme === "dark"
                        ? "Passer au mode clair"
                        : "Passer au mode sombre"
                    }
                    title={
                      theme === "dark"
                        ? "Passer au mode clair"
                        : "Passer au mode sombre"
                    }
                  >
                    {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                  </button>
                </div>
              </div>
            </header>
            <div className="min-h-screen p-6 md:p-8">{children}</div>
          </main>
        </div>
      </div>
    </AdminThemeContext.Provider>
  );
}

function baseIcon(children: React.ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return baseIcon(<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-10h8V3h-8z" />);
}

function ProfileIcon() {
  return baseIcon(<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 0 0-14 0" />);
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

function MoonIcon() {
  return baseIcon(<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />);
}

function SunIcon() {
  return baseIcon(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
    </>
  );
}

function LogoutIcon() {
  return baseIcon(<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5M21 12H9" />);
}
