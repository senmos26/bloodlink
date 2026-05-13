"use client";

import { createContext, useContext } from "react";

export type AdminTheme = "light" | "dark";

export const AdminThemeContext = createContext<{
  theme: AdminTheme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
