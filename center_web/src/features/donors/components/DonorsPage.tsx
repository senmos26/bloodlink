"use client";

import { useState } from "react";
import { Users, Search, Droplets, Phone, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchDonors } from "@/features/donors/lib/hooks";
import type { BloodType } from "@/entities";
import { cn } from "@/lib/utils";

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function DonorCard({ donor }: { donor: { id: string; fullName: string | null; phone: string | null; bloodType: BloodType | null; totalDonations: number; lastDonationDate: string | null; nextDonationDate: string | null } }) {
  const canDonate = !donor.nextDonationDate || new Date(donor.nextDonationDate) <= new Date();

  return (
    <Card className="group transition-all duration-200 hover:shadow-md border-l-4 border-l-rose-400">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-100 p-2.5">
              <Users className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{donor.fullName ?? "Donneur"}</p>
              {donor.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {donor.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {donor.bloodType && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                {donor.bloodType}
              </span>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-medium border",
                canDonate
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              )}
            >
              {canDonate ? "Éligible" : "En attente"}
            </Badge>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" /> {donor.totalDonations} don{donor.totalDonations !== 1 ? "s" : ""}
          </span>
          {donor.lastDonationDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Dernier : {new Date(donor.lastDonationDate).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DonorsPage() {
  const [query, setQuery] = useState("");
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | undefined>(undefined);

  const { data: donors, isLoading } = useSearchDonors(query, selectedBloodType);

  const bloodTypeFilter = (
    <div className="flex flex-wrap gap-1.5">
      <Button
        size="sm"
        variant={selectedBloodType === undefined ? "default" : "outline"}
        className={cn("h-7 text-xs", selectedBloodType === undefined && "bg-rose-600 hover:bg-rose-700")}
        onClick={() => setSelectedBloodType(undefined)}
      >
        Tous
      </Button>
      {BLOOD_TYPES.map((bt) => (
        <Button
          key={bt}
          size="sm"
          variant={selectedBloodType === bt ? "default" : "outline"}
          className={cn("h-7 text-xs", selectedBloodType === bt && "bg-rose-600 hover:bg-rose-700")}
          onClick={() => setSelectedBloodType(bt === selectedBloodType ? undefined : bt)}
        >
          {bt}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Donneurs</h1>
          <p className="text-sm text-slate-500">
            {donors?.length ?? 0} résultat{((donors?.length ?? 0) !== 1) ? "s" : ""}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou téléphone..."
            className="pl-9 w-64"
          />
        </div>
      </div>

      {bloodTypeFilter}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : donors?.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          {donors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      ) : query.trim().length >= 2 || selectedBloodType ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Aucun donneur trouvé</h3>
          <p className="text-sm text-slate-500 mt-1">Essayez avec d'autres critères de recherche</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Rechercher un donneur</h3>
          <p className="text-sm text-slate-500 mt-1">Saisissez au moins 2 caractères ou filtrez par groupe sanguin</p>
        </div>
      )}
    </div>
  );
}
