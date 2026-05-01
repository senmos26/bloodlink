import ProtectedAdminShell from "@/components/ProtectedAdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedAdminShell>{children}</ProtectedAdminShell>;
}
