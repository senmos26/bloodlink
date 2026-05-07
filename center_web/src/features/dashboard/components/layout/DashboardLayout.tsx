"use client";

import { useState, useEffect } from "react";
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import {
  useLayout,
  LayoutProvider,
} from "@/features/dashboard/lib/LayoutContext";
import { cn } from "@/lib/utils";

// Custom hook for media query, defined locally for this component
function useMediaQuery(query: string): boolean {
  const isClient = typeof window === "object";

  const [matches, setMatches] = useState<boolean>(() => {
    if (!isClient) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!isClient) return;
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", listener);
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query, isClient, matches]);

  return matches;
}

// Enhanced Shell component that uses the layout context
function ShellWithContext({ children }: { children: ReactNode }) {
  const { config, toggleSidebar, isMobileSidebarOpen, toggleMobileSidebar } =
    useLayout();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // On desktop, the sidebar's collapsed state is controlled by user config.
  // On mobile, the sidebar is never collapsed when open.
  const isSidebarEffectivelyCollapsed = isDesktop
    ? config.sidebar.collapsed
    : false;

  return (
    <div className="min-h-[100dvh] w-full bg-light text-foreground overflow-x-hidden">
      {/* Mobile overlay */}
      {!isDesktop && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30"
          onClick={toggleMobileSidebar}
          aria-hidden="true"
        />
      )}

      <div className="h-full flex">
        {/* Sidebar - Fixed on all screen sizes */}
        <div
          className={cn(
            // Base styles - Fixed position on all screens
            "fixed inset-y-0 left-0 h-full border-r bg-white transition-all duration-300 ease-in-out transform-gpu will-change-transform",
            // Mobile: overlay with higher z-index, hidden by default
            "z-30 w-72",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop: always visible, lower z-index
            "lg:translate-x-0 lg:z-10",
            // Desktop width based on collapsed state
            config.sidebar.collapsed ? "lg:w-20" : "lg:w-72"
          )}
          aria-label="Sidebar"
        >
          <Sidebar
            collapsed={isSidebarEffectivelyCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* Main content - Add left margin to account for fixed sidebar */}
        <div 
          className={cn(
            "flex-1 min-h-[100dvh] flex flex-col overflow-hidden transition-all duration-300",
            // Add left margin on desktop to account for fixed sidebar
            config.sidebar.collapsed ? "lg:ml-20" : "lg:ml-72"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Main DashboardLayout component
interface DashboardLayoutClientProps {
  children: ReactNode;
  navbar: ReactNode;
  // Layout customization props
  showSidebar?: boolean;
  layoutVariant?: "default" | "compact" | "minimal";
  pageTitle?: string;
  pageDescription?: string;
}

export function DashboardLayoutClient({
  children,
  navbar,
  showSidebar = true,
  layoutVariant = "default",
  pageTitle,
  pageDescription,
}: DashboardLayoutClientProps) {
  const { config, setLayoutVariant } = useLayout();

  // Update layout variant if different from current
  if (config.layout.variant !== layoutVariant) {
    setLayoutVariant(layoutVariant);
  }

  // If no sidebar is needed, render just the content with navbar
  if (!showSidebar) {
    return (
      <div className="min-h-[100dvh] w-full bg-light text-foreground flex flex-col overflow-x-hidden">
        {navbar}
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Full layout with sidebar and navbar
  return (
    <ShellWithContext>
      {navbar}
      <main className="flex-1 p-4 sm:p-6">
        {/* Page header if title is provided */}
        {(pageTitle || pageDescription) && (
          <div className="mb-6">
            {pageTitle && (
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {pageTitle}
              </h1>
            )}
            {pageDescription && (
              <p className="text-sm text-foreground/70 mt-1">
                {pageDescription}
              </p>
            )}
          </div>
        )}

        {/* Page content - removed space-y-6 to let pages control their own spacing */}
        {children}
      </main>
    </ShellWithContext>
  );
}
// Wrapper component that provides the layout context
interface DashboardLayoutWrapperProps {
  children: ReactNode;
  navbar: ReactNode;
  showSidebar?: boolean;
  layoutVariant?: "default" | "compact" | "minimal";
  pageTitle?: string;
  pageDescription?: string;
}

export function DashboardLayoutWrapper(props: DashboardLayoutWrapperProps) {
  return (
    <LayoutProvider>
      <DashboardLayoutClient {...props} />
    </LayoutProvider>
  );
}

// Export types for external use
export type { DashboardLayoutClientProps, DashboardLayoutWrapperProps };
