import { type ReactNode } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { DashboardLayoutServer } from "@/features/dashboard/components/layout/DashboardLayout.server";
import { LayoutProvider } from "@/features/dashboard/lib/LayoutContext";

interface AdminShellProps {
  children: ReactNode;
}

/**
 * Server-side shell for the admin dashboard.
 * Enforces authentication, wraps in layout context, and renders the dashboard layout.
 */
export async function AdminShell({ children }: AdminShellProps) {
  return (
    <RequireAuth>
      <LayoutProvider>
        <DashboardLayoutServer
          showNavbar={true}
          showSidebar={true}
          layoutVariant="default"
        >
          {children}
        </DashboardLayoutServer>
      </LayoutProvider>
    </RequireAuth>
  );
}
