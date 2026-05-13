import EnhancedAdminShell from "@/components/EnhancedAdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EnhancedAdminShell>{children}</EnhancedAdminShell>;
}
