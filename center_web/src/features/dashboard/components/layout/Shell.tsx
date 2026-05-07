"use client";

import { useState } from "react";
import { Sidebar } from "@/features/dashboard/components/layout/Sidebar";

export function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="h-[100dvh] w-full bg-light text-foreground">
      <div
        className={`fixed inset-y-0 left-0 border-r bg-white transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-72"
        }`}
        aria-label="Sidebar"
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </div>
      <div
        className={`${
          collapsed ? "pl-16" : "pl-72"
        } h-full flex flex-col transition-all duration-300 ease-in-out`}
      >
        {children}
      </div>
    </div>
  );
}
