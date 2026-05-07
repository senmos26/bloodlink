import { ReactNode } from "react";
import { Navbar } from "./Navbar.server";
import { DashboardLayoutWrapper } from "./DashboardLayout";

interface DashboardLayoutServerProps {
  children: ReactNode;
  showNavbar?: boolean;
  showSidebar?: boolean;
  layoutVariant?: "default" | "compact" | "minimal";
  pageTitle?: string;
  pageDescription?: string;
}

export async function DashboardLayoutServer({
  children,
  showNavbar = true,
  showSidebar = true,
  layoutVariant = "default",
  pageTitle,
  pageDescription,
}: DashboardLayoutServerProps) {
  return (
    <DashboardLayoutWrapper
      navbar={showNavbar ? <Navbar /> : null}
      showSidebar={showSidebar}
      layoutVariant={layoutVariant}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
    >
      {children}
    </DashboardLayoutWrapper>
  );
}
