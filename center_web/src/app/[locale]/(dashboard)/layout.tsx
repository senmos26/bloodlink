import { ReactNode } from "react";
import { DashboardLayoutServer } from "@/features/dashboard/components/layout/DashboardLayout.server";

interface DashboardLayoutProps {
  children: ReactNode;
  // Page metadata that can be passed down
  pageTitle?: string;
  pageDescription?: string;
}

export default async function DashboardLayout({
  children,
  pageTitle,
  pageDescription,
}: DashboardLayoutProps) {
  return (
    <DashboardLayoutServer
      showNavbar={true}
      showSidebar={true}
      layoutVariant="default"
      pageTitle={pageTitle}
      pageDescription={pageDescription}
    >
      {children}
    </DashboardLayoutServer>
  );
}
