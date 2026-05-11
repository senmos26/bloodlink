"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface LayoutConfig {
  sidebar: {
    visible: boolean;
    collapsed: boolean;
  };
  navbar: {
    visible: boolean;
  };
  variant: "default" | "compact" | "minimal";
}

interface LayoutContextValue {
  config: LayoutConfig;
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  toggleNavbar: () => void;
  setVariant: (variant: LayoutConfig["variant"]) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const STORAGE_KEY = "bloodlink-admin-layout-config";

const defaultConfig: LayoutConfig = {
  sidebar: { visible: true, collapsed: false },
  navbar: { visible: true },
  variant: "default",
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<LayoutConfig>(() => {
    if (typeof window === "undefined") return defaultConfig;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultConfig, ...parsed };
      }
    } catch {
      // ignore
    }
    return defaultConfig;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const toggleSidebar = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      sidebar: {
        ...prev.sidebar,
        collapsed: !prev.sidebar.collapsed,
      },
    }));
  }, []);

  const toggleNavbar = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      navbar: { visible: !prev.navbar.visible },
    }));
  }, []);

  const setVariant = useCallback((variant: LayoutConfig["variant"]) => {
    setConfig((prev) => ({ ...prev, variant }));
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      config,
      isMobileSidebarOpen,
      toggleSidebar,
      toggleNavbar,
      setVariant,
      toggleMobileSidebar,
      closeMobileSidebar,
    }),
    [config, isMobileSidebarOpen, toggleSidebar, toggleNavbar, setVariant, toggleMobileSidebar, closeMobileSidebar]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
