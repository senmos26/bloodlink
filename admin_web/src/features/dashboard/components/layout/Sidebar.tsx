"use client";

import {
  LayoutDashboard,
  Bell,
  CalendarDays,
  Users,
  Building2,
  HeartPulse,
  BellRing,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Droplets,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLayout } from "@/features/dashboard/lib/LayoutContext";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/features/auth/lib/actions";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navSections = [
  {
    title: "Supervision",
    items: [
      { key: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, href: "/admin/dashboard" },
      { key: "alerts", label: "Alertes Urgentes", icon: Bell, href: "/admin/alerts" },
      { key: "appointments", label: "Rendez-vous", icon: CalendarDays, href: "/admin/appointments" },
      { key: "donations", label: "Dons", icon: HeartPulse, href: "/admin/donations" },
    ],
  },
  {
    title: "Gestion",
    items: [
      { key: "profiles", label: "Donneurs / Profils", icon: Users, href: "/admin/profiles" },
      { key: "centers", label: "Centres de Santé", icon: Building2, href: "/admin/centers" },
      { key: "notifications", label: "Notifications", icon: BellRing, href: "/admin/notifications" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { key: "settings", label: "Paramètres", icon: Settings, href: "/admin/settings" },
    ],
  },
];

export function Sidebar({ collapsed: collapsedProp, onToggle }: SidebarProps) {
  const { config, toggleSidebar, isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useLayout();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const collapsed = collapsedProp ?? config.sidebar.collapsed;
  const toggle = () => (onToggle ? onToggle() : toggleSidebar());

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Swipe gestures on mobile
  useEffect(() => {
    if (!isMobile) return;

    const minSwipeDistance = 30;

    const handleTouchStart = (e: TouchEvent) => {
      const startX = e.targetTouches[0].clientX;
      const screenWidth = window.innerWidth;
      const triggerZone = Math.min(300, Math.max(100, screenWidth * 0.3));

      if (startX <= triggerZone || isMobileSidebarOpen) {
        setTouchEnd(null);
        setTouchStart(startX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart !== null) setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isRightSwipe && !isMobileSidebarOpen) toggleMobileSidebar();
      else if (isLeftSwipe && isMobileSidebarOpen) toggleMobileSidebar();

      setTouchStart(null);
      setTouchEnd(null);
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, touchStart, touchEnd, isMobileSidebarOpen, toggleMobileSidebar]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        ref={sidebarRef}
        className={cn(
          "h-screen flex flex-col bg-white border-r border-slate-100 shadow-sm transition-all duration-300 ease-in-out",
          "transform-gpu will-change-transform",
          isMobile
            ? cn(
                "fixed left-0 top-0 z-50 w-72",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              )
            : cn(
                "sticky top-0",
                collapsed ? "w-20" : "w-72"
              )
        )}
      >
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="size-10 rounded-2xl bg-rose-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-200">
              <Droplets className="size-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight select-none transition-opacity duration-300">
                <span className="font-black text-xl text-slate-900 tracking-tighter">BloodLink</span>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                  Admin Pro
                </span>
              </div>
            )}
          </div>
          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              type="button"
              onClick={toggle}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto py-6 px-3">
          <TooltipProvider delayDuration={300}>
            <div className="space-y-8">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  {!collapsed && (
                    <div className="px-4 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));

                    return (
                      <Tooltip key={item.key}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            onClick={isMobile ? closeMobileSidebar : undefined}
                            className={cn(
                              "group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ease-out mb-1",
                              isActive
                                ? "bg-rose-50 text-rose-600 shadow-sm shadow-rose-100/50"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                          >
                            <Icon
                              className={cn(
                                "transition-transform duration-300",
                                collapsed ? "size-6" : "size-5",
                                isActive ? "scale-110" : "group-hover:scale-110"
                              )}
                            />
                            {!collapsed && <span className="flex-1">{item.label}</span>}
                          </Link>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right" className="font-bold bg-slate-900 text-white border-0">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </nav>

        {/* Logout */}
        <div className="border-t p-3">
          <form action={signOut}>
            <button
              type="submit"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 transition-all duration-200",
                "hover:bg-red-50",
                collapsed && "justify-center"
              )}
            >
              <LogOut className="size-5 shrink-0" />
              {!collapsed && <span>Se déconnecter</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
