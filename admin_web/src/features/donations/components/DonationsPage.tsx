"use client";

import { useState } from "react";
import {
  Droplets,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  User,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDateTime } from "@/lib/utils";
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

const STATUS_CONFIG: Record<DonationStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  validated: { label: "Validé", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-700", icon: XCircle },
};

// ─── Component ──────────────────────────────────────────────────────

interface DonationsPageProps {
  initialDonations: DonationRow[];
}

export function DonationsPage({ initialDonations }: DonationsPageProps) {
  const [donations, setDonations] = useState(initialDonations);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filteredDonations = donations.filter((d) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      [
        d.profiles?.full_name,
        d.centers?.name,
        d.notes,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleValidate(donationId: string) {
    setActionLoading(donationId);
    const result = await validateDonation(donationId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Don validé avec succès.");
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId ? { ...d, status: "validated" as DonationStatus } : d
        )
      );
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
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donationId ? { ...d, status: "rejected" as DonationStatus, notes: rejectReason || d.notes } : d
        )
      );
    }
    setRejectingId(null);
    setRejectReason("");
    setActionLoading(null);
  }

  const pendingCount = donations.filter((d) => d.status === "pending").length;
  const validatedCount = donations.filter((d) => d.status === "validated").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dons de sang</h1>
        <p className="mt-1 text-sm text-slate-500">
          {pendingCount} en attente · {validatedCount} validés
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          const count = donations.filter((d) => d.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                statusFilter === status ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className={cn("flex size-8 items-center justify-center rounded-lg", config.color)}>
                <Icon className="size-4" />
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500">{config.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par donneur, centre, notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      {/* Donations list */}
      <div className="space-y-3">
        {filteredDonations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Aucun don trouvé.
          </div>
        ) : (
          filteredDonations.map((donation) => {
            const statusConfig = STATUS_CONFIG[donation.status];
            const StatusIcon = statusConfig.icon;
            const isLoading = actionLoading === donation.id;
            const isRejecting = rejectingId === donation.id;

            return (
              <div
                key={donation.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: info */}
                  <div className="flex items-start gap-3">
                    <div className={cn("flex size-10 items-center justify-center rounded-xl", statusConfig.color)}>
                      <Droplets className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDateTime(donation.donation_date)}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <User className="size-3" />
                        <span>{donation.profiles?.full_name || "Donneur inconnu"}</span>
                        {donation.profiles?.blood_type && (
                          <span className="font-bold text-rose-600">{donation.profiles.blood_type}</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="size-3" />
                        <span>{donation.centers?.name || "Centre inconnu"}</span>
                        <span>· {donation.volume_ml} mL</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex items-center gap-3">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusConfig.color)}>
                      {statusConfig.label}
                    </span>

                    {donation.status === "pending" && !isRejecting && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleValidate(donation.id)}
                          disabled={isLoading}
                          className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => setRejectingId(donation.id)}
                          disabled={isLoading}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reject reason input */}
                {isRejecting && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Raison du rejet (optionnel)"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-300"
                    />
                    <button
                      onClick={() => handleReject(donation.id)}
                      disabled={isLoading}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(""); }}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Annuler
                    </button>
                  </div>
                )}

                {/* Details */}
                {donation.notes && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {donation.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
