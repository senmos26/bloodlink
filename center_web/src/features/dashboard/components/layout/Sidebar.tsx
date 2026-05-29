"use client";

import {
  LayoutDashboard,
  CalendarDays,
  HeartPulse,
  Bell,
  Users,
  Settings,
  LogOut,
  Droplets,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLayout } from "@/features/dashboard/lib/LayoutContext";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
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

export function Sidebar({ collapsed: collapsedProp, onToggle: _onToggle }: SidebarProps) {
  const { config, isMobileSidebarOpen, toggleMobileSidebar } =
    useLayout();
  void _onToggle;
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("dashboard.sidebarCenter");
  const sidebarRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Use the global collapsed state from context
  const collapsed = collapsedProp ?? config.sidebar.collapsed;

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Gestion des gestes de swipe sur mobile
  const minSwipeDistance = 30; // Réduit pour plus de sensibilité

  // Ajouter les écouteurs de swipe uniquement sur mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const startX = e.targetTouches[0].clientX;
      const screenWidth = window.innerWidth;

      // Zone de déclenchement élargie et adaptative (entre 80px et 140px, ~30% de l'écran)
      const triggerZone = Math.min(300, Math.max(100, screenWidth * 0.3));
      const isInTriggerZone = startX <= triggerZone || isMobileSidebarOpen;

      if (isInTriggerZone) {
        setTouchEnd(null);
        setTouchStart(startX);
        console.log("Touch start in trigger zone:", {
          startX,
          triggerZone,
          isMobileSidebarOpen,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart !== null) {
        setTouchEnd(e.targetTouches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      console.log("Swipe detected:", {
        distance,
        isLeftSwipe,
        isRightSwipe,
        isMobileSidebarOpen,
        isMobile,
      });

      if (isRightSwipe && !isMobileSidebarOpen) {
        // Swipe vers la droite pour ouvrir le sidebar mobile
        console.log("Opening mobile sidebar");
        toggleMobileSidebar();
      } else if (isLeftSwipe && isMobileSidebarOpen) {
        // Swipe vers la gauche pour fermer le sidebar mobile
        console.log("Closing mobile sidebar");
        toggleMobileSidebar();
      }

      // Reset des états après traitement
      setTouchStart(null);
      setTouchEnd(null);
    };

    // Ajouter les écouteurs sur toute la page pour capturer les swipes
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    isMobile,
    touchStart,
    touchEnd,
    isMobileSidebarOpen,
    toggleMobileSidebar,
  ]);

  const navSections: {
    title: string;
    items: {
      key: string;
      label: string;
      icon: typeof LayoutDashboard;
      href: string;
    }[];
  }[] = [
      {
        title: t("operations"),
        items: [
          {
            key: "dashboard",
            label: t("dashboard"),
            icon: LayoutDashboard,
            href: `/${locale}/`,
          },
          {
            key: "appointments",
            label: t("appointments"),
            icon: CalendarDays,
            href: `/${locale}/appointments`,
          },
          {
            key: "donations",
            label: t("donations"),
            icon: HeartPulse,
            href: `/${locale}/donations`,
          },
          {
            key: "stock",
            label: t("stock"),
            icon: Droplets,
            href: `/${locale}/stock`,
          },
          {
            key: "alerts",
            label: t("alerts"),
            icon: Bell,
            href: `/${locale}/alerts`,
          },
        ],
      },
      {
        title: t("management"),
        items: [
          {
            key: "donors",
            label: t("donors"),
            icon: Users,
            href: `/${locale}/donors`,
          },
        ],
      },
      {
        title: t("configuration"),
        items: [
          {
            key: "settings",
            label: t("settings"),
            icon: Settings,
            href: `/${locale}/settings`,
          },
        ],
      },
    ];

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "h-[100vh] flex flex-col bg-white transition-all duration-300 ease-in-out border-r border-slate-100 shadow-sm",
        "transform-gpu will-change-transform"
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
                Center Pro
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
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
                    (item.href !== `/${locale}/` && pathname.startsWith(item.href + "/"));

                  return (
                    <Tooltip key={item.key}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
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
                          {!collapsed && (
                            <span className="flex-1">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-bold bg-slate-900 text-white border-0">
                        {item.label}
                      </TooltipContent>
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
        <button
          type="button"
          onClick={() => signOut()}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-600 transition-all duration-200",
            "hover:bg-red-50",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
