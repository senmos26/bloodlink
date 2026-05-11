"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useLayout } from "@/features/dashboard/lib/LayoutContext";
import { cn } from "@/lib/utils";

interface DashboardLayoutWrapperProps {
  navbar: ReactNode | null;
  showSidebar?: boolean;
  layoutVariant?: "default" | "compact" | "minimal";
  children: ReactNode;
}

export function DashboardLayoutWrapper({
  navbar,
  showSidebar = true,
  layoutVariant = "default",
  children,
}: DashboardLayoutWrapperProps) {
  const { config, isMobileSidebarOpen, closeMobileSidebar } = useLayout();

  const isMinimal = layoutVariant === "minimal" || config.variant === "minimal";
  const showNav = navbar && !isMinimal;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={cn("flex min-h-screen")}>
        {/* Sidebar */}
        {showSidebar && !isMinimal && <Sidebar />}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {showNav && navbar}

          <main className="flex-1 p-6 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
