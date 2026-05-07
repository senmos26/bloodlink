"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Props {
  overview: React.ReactNode;
  performance: React.ReactNode;
  activities: React.ReactNode;
}

export function TabbedSections({ overview, performance, activities }: Props) {
  const [tab, setTab] = useState<"overview" | "performance" | "activities">(
    "overview"
  );
  const t = useTranslations("dashboard.tabs");
  const tablistRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tabs = ["overview", "performance", "activities"] as const;
      const currentIndex = tabs.indexOf(tab);
      
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % tabs.length;
        setTab(tabs[nextIndex]);
        // Focus the new tab
        const nextButton = tablistRef.current?.querySelector(`#${tabs[nextIndex]}-tab`) as HTMLButtonElement;
        nextButton?.focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        setTab(tabs[prevIndex]);
        // Focus the new tab
        const prevButton = tablistRef.current?.querySelector(`#${tabs[prevIndex]}-tab`) as HTMLButtonElement;
        prevButton?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        setTab(tabs[0]);
        const firstButton = tablistRef.current?.querySelector(`#${tabs[0]}-tab`) as HTMLButtonElement;
        firstButton?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        setTab(tabs[tabs.length - 1]);
        const lastButton = tablistRef.current?.querySelector(`#${tabs[tabs.length - 1]}-tab`) as HTMLButtonElement;
        lastButton?.focus();
      }
    };
    
    const tablist = tablistRef.current;
    tablist?.addEventListener('keydown', handleKeyDown);
    return () => tablist?.removeEventListener('keydown', handleKeyDown);
  }, [tab]);

  return (
    <div className="mt-4">
      {/* Tabs bar */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={t("sectionsLabel")}
        className="grid grid-cols-3 gap-1 sm:gap-2 rounded-full bg-light border p-1 text-xs sm:text-sm"
      >
        <button
          id="overview-tab"
          role="tab"
          aria-selected={tab === "overview"}
          aria-controls="overview-panel"
          tabIndex={tab === "overview" ? 0 : -1}
          className={cn(
            "rounded-full py-2 px-1 sm:px-3 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white text-sky-800 text-center leading-tight",
            tab === "overview" &&
              "bg-[#235764] text-white font-semibold shadow-md hover:bg-[#235764]"
          )}
          onClick={() => setTab("overview")}
        >
          <span className="hidden sm:block truncate">{t("overview")}</span>
          <span className="block sm:hidden truncate">{t("overviewShort")}</span>
        </button>
        <button
          id="performance-tab"
          role="tab"
          aria-selected={tab === "performance"}
          aria-controls="performance-panel"
          tabIndex={tab === "performance" ? 0 : -1}
          className={cn(
            "rounded-full py-2 px-1 sm:px-3 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white text-sky-800 text-center leading-tight",
            tab === "performance" &&
              "bg-[#235764] text-white font-semibold shadow-md hover:bg-[#235764]"
          )}
          onClick={() => setTab("performance")}
        >
          <span className="hidden sm:block truncate">{t("performance")}</span>
          <span className="block sm:hidden truncate">{t("performanceShort")}</span>
        </button>
        <button
          id="activities-tab"
          role="tab"
          aria-selected={tab === "activities"}
          aria-controls="activities-panel"
          tabIndex={tab === "activities" ? 0 : -1}
          className={cn(
            "rounded-full py-2 px-1 sm:px-3 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white text-sky-800 text-center leading-tight",
            tab === "activities" &&
              "bg-[#235764] text-white font-semibold shadow-md hover:bg-[#235764]"
          )}
          onClick={() => setTab("activities")}
        >
          <span className="hidden sm:block truncate">{t("activities")}</span>
          <span className="block sm:hidden truncate">{t("activitiesShort")}</span>
        </button>
      </div>

      {/* Panels */}
      <div className="mt-4">
        <div
          id="overview-panel"
          role="tabpanel"
          aria-labelledby="overview-tab"
          hidden={tab !== "overview"}
          tabIndex={0}
        >
          {overview}
        </div>
        <div
          id="performance-panel"
          role="tabpanel"
          aria-labelledby="performance-tab"
          hidden={tab !== "performance"}
          tabIndex={0}
        >
          {performance}
        </div>
        <div
          id="activities-panel"
          role="tabpanel"
          aria-labelledby="activities-tab"
          hidden={tab !== "activities"}
          tabIndex={0}
        >
          {activities}
        </div>
      </div>
    </div>
  );
}
