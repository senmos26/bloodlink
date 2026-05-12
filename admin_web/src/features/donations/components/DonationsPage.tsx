"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Droplets,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Eye,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/shared/components/PageHeader";
import { FilterBar } from "@/shared/components/FilterBar";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { Pagination } from "@/shared/components/Pagination";
import { DetailsDrawer } from "@/shared/components/DetailsDrawer";
import { validateDonation, rejectDonation } from "@/features/donations/lib/actions";
import type { DonationStatus } from "@/types/database";

// ─── Types ──────────────────────────────────────────────────────────

interface DonationRow {
  id: string;
  donor_id: string;
  center_id: string;
  appointment_id: string | null;
  donation_date: string;
  volume_ml: number;
  status: DonationStatus;
  validated_by: string | null;
  validated_at: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string; blood_type: string | null } | null;
  centers?: { name: string; city: string | null } | null;
}

// ─── Constants ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DonationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success"; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "En attente", variant: "secondary", icon: Clock },
  validated: { label: "Validé", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Rejeté", variant: "destructive", icon: XCircle },
};

// ─── Component ──────────────────────────────────────────────────────

interface DonationsPageProps {
  initialDonations: DonationRow[];
}

const PAGE_SIZE = 10;

export function DonationsPage({ initialDonations }: DonationsPageProps) {
  const searchParams = useSearchParams();
  const [donations, setDonations] = React.useState(initialDonations);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [selectedDonation, setSelectedDonation] = React.useState<DonationRow | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const currentPage = Number(searchParams.get("page")) || 1;
  const statusFilter = searchParams.get("status") || "all";
  const q = (searchParams.get("q") || "").toLowerCase();

  const filtered = React.useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch =
        !q ||
        [d.profiles?.full_name, d.centers?.name, d.notes]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [donations, q, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleValidate(donationId: string) {
    setActionLoading(donationId);
    const result = await validateDonation(donationId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Don validé.");
      setDonations((prev) => prev.map((d) => (d.id === donationId ? { ...d, status: "validated" as DonationStatus } : d)));
    }
    setActionLoading(null);
  }

  async function handleReject(donationId: string) {
    setActionLoading(donationId);
    const result = await rejectDonation(donationId, rejectReason || undefined);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Don rejeté.");
      setDonations((prev) => prev.map((d) => (d.id === donationId ? { ...d, status: "rejected" as DonationStatus, notes: rejectReason || d.notes } : d)));
    }
    setRejectingId(null);
    setRejectReason("");
    setActionLoading(null);
  }

  const pendingCount = donations.filter((d) => d.status === "pending").length;
  const validatedCount = donations.filter((d) => d.status === "validated").length;

  const columns: Column<DonationRow>[] = [
    {
      key: "date",
      header: "Date",
      cell: (d) => {
        const config = STATUS_CONFIG[d.status];
        const StatusIcon = config.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", d.status === "rejected" ? "bg-red-50 border-red-200" : d.status === "validated" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200")}>
              <StatusIcon className={cn("h-4 w-4", d.status === "rejected" ? "text-red-600" : d.status === "validated" ? "text-green-600" : "text-yellow-600")} />
            </div>
            <div>
              <p className="font-medium text-slate-900">{formatDateTime(d.donation_date)}</p>
              <p className="text-xs text-slate-400">{d.centers?.name || "Centre inconnu"}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "donor",
      header: "Donneur",
      cell: (d) => (
        <div className="text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-slate-400" />
            {d.profiles?.full_name || "—"}
          </div>
          {d.profiles?.blood_type && (
            <div className="flex items-center gap-1.5 mt-0.5 font-bold text-rose-600">
              <Droplets className="h-3 w-3" />
              {d.profiles.blood_type}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "volume",
      header: "Volume",
      cell: (d) => <span className="text-sm font-medium text-slate-700">{d.volume_ml} mL</span>,
    },
    {
      key: "status",
      header: "Statut",
      cell: (d) => {
        const s = STATUS_CONFIG[d.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (d) => {
        const isLoading = actionLoading === d.id;
        const isRejecting = rejectingId === d.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 bg-white hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDonation(d);
                setIsDrawerOpen(true);
              }}
              title="Voir détails"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            {d.status === "pending" && !isRejecting && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 hover:border-green-300"
                  onClick={(e) => { e.stopPropagation(); handleValidate(d.id); }}
                  disabled={isLoading}
                  title="Valider le don"
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Valider
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300"
                  onClick={(e) => { e.stopPropagation(); setRejectingId(d.id); }}
                  disabled={isLoading}
                  title="Rejeter le don"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Rejeter
                </Button>
              </>
            )}
            {isRejecting && (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Raison du rejet"
                  className="h-8 w-44 text-xs"
                />
                <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleReject(d.id)} disabled={isLoading}>
                  Confirmer
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs border-slate-200" onClick={() => { setRejectingId(null); setRejectReason(""); }}>
                  Annuler
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const drawerFields = selectedDonation
    ? [
        { label: "Date", value: formatDateTime(selectedDonation.donation_date) },
        { label: "Centre", value: (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            {selectedDonation.centers?.name || "—"}
          </div>
        )},
        { label: "Donneur", value: (
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {selectedDonation.profiles?.full_name || "—"}
            {selectedDonation.profiles?.blood_type && (
              <span className="font-bold text-rose-600 ml-1">{selectedDonation.profiles.blood_type}</span>
            )}
          </div>
        )},
        { label: "Volume", value: `${selectedDonation.volume_ml} mL` },
        { label: "Statut", value: <Badge variant={STATUS_CONFIG[selectedDonation.status].variant}>{STATUS_CONFIG[selectedDonation.status].label}</Badge> },
        { label: "Notes", value: selectedDonation.notes || "—" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dons de sang"
        description={`${pendingCount} en attente · ${validatedCount} validés`}
      />

      <FilterBar
        searchPlaceholder="Rechercher par donneur, centre, notes..."
        resultsCount={filtered.length}
        filters={[
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "pending", label: "En attente" },
              { value: "validated", label: "Validé" },
              { value: "rejected", label: "Rejeté" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(d) => d.id}
        emptyMessage="Aucun don trouvé."
        onRowClick={(d) => {
          setSelectedDonation(d);
          setIsDrawerOpen(true);
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        resultsCount={filtered.length}
        pageSize={PAGE_SIZE}
      />

      <DetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Don — ${selectedDonation?.profiles?.full_name || "Détails"}`}
        fields={drawerFields}
      />
    </div>
  );
}
