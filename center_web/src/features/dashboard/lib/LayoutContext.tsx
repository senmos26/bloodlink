"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Layout configuration interfaces
export interface LayoutConfig {
  sidebar: {
    collapsed: boolean;
    width: number;
    collapsedWidth: number;
  };
  navbar: {
    visible: boolean;
    sticky: boolean;
    searchVisible: boolean;
    userInfoVisible: boolean;
  };
  layout: {
    variant: "default" | "compact" | "minimal";
    padding: "default" | "compact" | "none";
    maxWidth: "full" | "container" | "narrow";
  };
}

export interface LayoutContextType {
  // State
  config: LayoutConfig;
  isMobileSidebarOpen: boolean; // New state for mobile sidebar

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleMobileSidebar: () => void; // New action for mobile

  // Navbar actions
  setNavbarVisible: (visible: boolean) => void;
  setNavbarSticky: (sticky: boolean) => void;
  setSearchVisible: (visible: boolean) => void;
  setUserInfoVisible: (visible: boolean) => void;

  // Layout actions
  setLayoutVariant: (variant: LayoutConfig["layout"]["variant"]) => void;
  setLayoutPadding: (padding: LayoutConfig["layout"]["padding"]) => void;
  setLayoutMaxWidth: (maxWidth: LayoutConfig["layout"]["maxWidth"]) => void;

  // Utility
  resetToDefaults: () => void;
  persistState: () => void;
}

// Default configuration
const defaultConfig: LayoutConfig = {
  sidebar: {
    collapsed: false,
    width: 280, // Légèrement plus large pour les icônes agrandies
    collapsedWidth: 72, // Plus large pour les icônes agrandies en mode collapsed
  },
  navbar: {
    visible: true,
    sticky: true,
    searchVisible: true,
    userInfoVisible: true,
  },
  layout: {
    variant: "default",
    padding: "default",
    maxWidth: "full",
  },
};

// Local storage key
const LAYOUT_STORAGE_KEY = "pam-dashboard-layout-config";

// Create context
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// Provider component
export function LayoutProvider({ children }: { children: ReactNode }) {
  // Initialize state with localStorage or defaults
  const [config, setConfig] = useState<LayoutConfig>(() => {
    if (typeof window === "undefined") return defaultConfig;

    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultConfig, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to load layout config from localStorage:", error);
    }

    return defaultConfig;
  });

  // State for mobile sidebar visibility (not persisted)
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Persist to localStorage whenever config changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn("Failed to save layout config to localStorage:", error);
    }
  }, [config]);

  // Sidebar actions
  const toggleSidebar = () => {
    setConfig((prev) => ({
      ...prev,
      sidebar: {
        ...prev.sidebar,
        collapsed: !prev.sidebar.collapsed,
      },
    }));
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((prev) => !prev);
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setConfig((prev) => ({
      ...prev,
      sidebar: {
        ...prev.sidebar,
        collapsed,
      },
    }));
  };

  const setSidebarWidth = (width: number) => {
    setConfig((prev) => ({
      ...prev,
      sidebar: {
        ...prev.sidebar,
        width,
      },
    }));
  };

  // Navbar actions
  const setNavbarVisible = (visible: boolean) => {
    setConfig((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        visible,
      },
    }));
  };

  const setNavbarSticky = (sticky: boolean) => {
    setConfig((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        sticky,
      },
    }));
  };

  const setSearchVisible = (visible: boolean) => {
    setConfig((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        searchVisible: visible,
      },
    }));
  };

  const setUserInfoVisible = (visible: boolean) => {
    setConfig((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        userInfoVisible: visible,
      },
    }));
  };

  // Layout actions
  const setLayoutVariant = (variant: LayoutConfig["layout"]["variant"]) => {
    setConfig((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        variant,
      },
    }));
  };

  const setLayoutPadding = (padding: LayoutConfig["layout"]["padding"]) => {
    setConfig((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        padding,
      },
    }));
  };

  const setLayoutMaxWidth = (maxWidth: LayoutConfig["layout"]["maxWidth"]) => {
    setConfig((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        maxWidth,
      },
    }));
  };

  // Utility actions
  const resetToDefaults = () => {
    setConfig(defaultConfig);
  };

  const persistState = () => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn("Failed to persist layout config:", error);
    }
  };

  const value: LayoutContextType = {
    config,
    isMobileSidebarOpen,
    toggleSidebar,
    toggleMobileSidebar,
    setSidebarCollapsed,
    setSidebarWidth,
    setNavbarVisible,
    setNavbarSticky,
    setSearchVisible,
    setUserInfoVisible,
    setLayoutVariant,
    setLayoutPadding,
    setLayoutMaxWidth,
    resetToDefaults,
    persistState,
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

// Custom hook to use the context
export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

// Export the context for advanced usage
export { LayoutContext };
