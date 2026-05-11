"use client";

import { useState } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  Pencil,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleCenterActive } from "@/features/centers/lib/actions";
import type { Center } from "@/types/database";

// ─── Types ──────────────────────────────────────────────────────────

interface CentersPageProps {
  initialCenters: Center[];
}

// ─── Component ──────────────────────────────────────────────────────

export function CentersPage({ initialCenters }: CentersPageProps) {
  const [centers, setCenters] = useState(initialCenters);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredCenters = centers.filter((c) => {
    const query = searchTerm.trim().toLowerCase();
    return (
      query.length === 0 ||
      [c.name, c.city, c.address, c.phone, c.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query))
    );
  });

  async function handleToggleActive(centerId: string, isActive: boolean) {
    setActionLoading(centerId);
    const result = await toggleCenterActive(centerId, !isActive);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isActive ? "Centre désactivé." : "Centre activé.");
      setCenters((prev) =>
        prev.map((c) => (c.id === centerId ? { ...c, is_active: !isActive } : c))
      );
    }
    setActionLoading(null);
  }

  const activeCount = centers.filter((c) => c.is_active).length;
  const inactiveCount = centers.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Centres de santé</h1>
          <p className="mt-1 text-sm text-slate-500">
            {centers.length} centres · {activeCount} actifs · {inactiveCount} inactifs
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, ville, adresse..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
      </div>

      {/* Centers grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCenters.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Aucun centre trouvé.
          </div>
        ) : (
          filteredCenters.map((center) => {
            const isLoading = actionLoading === center.id;

            return (
              <div
                key={center.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-xl",
                      center.is_active ? "bg-blue-50" : "bg-slate-100"
                    )}>
                      <Building2 className={cn("size-5", center.is_active ? "text-blue-600" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{center.name}</p>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        center.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      )}>
                        {center.is_active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3" />
                    <span>{center.address}, {center.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-3" />
                    <span>{center.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-3" />
                    <span>{center.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleToggleActive(center.id, center.is_active)}
                    disabled={isLoading}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                      center.is_active
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    )}
                  >
                    {center.is_active ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
