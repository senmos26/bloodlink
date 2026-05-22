"use client";

import { useState } from "react";
import { Users, Search, Droplets, Phone, Calendar, Grid3X3, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchDonors } from "@/features/donors/lib/hooks";
import type { Donor, BloodType } from "@/entities";
import { cn } from "@/lib/utils";

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function DonorCard({ donor }: { donor: Donor }) {
  const canDonate = !donor.nextDonationDate || new Date(donor.nextDonationDate) <= new Date();

  return (
    <Card className="group transition-all duration-200 hover:shadow-md border-l-4 border-l-rose-400">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-rose-50 p-2.5 border border-rose-100/50">
              <Users className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{donor.fullName ?? "Donneur"}</p>
              {donor.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3 text-slate-400" /> {donor.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {donor.bloodType && (
              <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
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
            <Droplets className="h-3.5 w-3.5 text-rose-500" /> {donor.totalDonations} don{donor.totalDonations !== 1 ? "s" : ""}
          </span>
          {donor.lastDonationDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> Dernier : {new Date(donor.lastDonationDate).toLocaleDateString("fr-FR")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DonorListItem({ donor }: { donor: Donor }) {
  const canDonate = !donor.nextDonationDate || new Date(donor.nextDonationDate) <= new Date();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
        {/* Donor Icon */}
        <div className="rounded-full bg-rose-50 p-2 border border-rose-100/50 flex-shrink-0">
          <Users className="h-4 w-4 text-rose-500" />
        </div>

        {/* Donor Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800 truncate">
              {donor.fullName ?? "Donneur"}
            </span>
            {donor.bloodType && (
              <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">
                {donor.bloodType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {donor.phone && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" />
                {donor.phone}
              </span>
            )}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Droplets className="h-3.5 w-3.5 text-rose-500" />
              {donor.totalDonations} don{donor.totalDonations !== 1 ? "s" : ""}
            </span>
            {donor.lastDonationDate && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Dernier : {new Date(donor.lastDonationDate).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Column */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium border px-2.5 py-0.5",
            canDonate
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          )}
        >
          {canDonate ? "Éligible" : "En attente"}
        </Badge>
      </div>
    </div>
  );
}

export default function DonorsPage() {
  const [query, setQuery] = useState("");
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: donors, isLoading } = useSearchDonors(query, selectedBloodType);

  const gridSkeletons = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  );

  const listSkeletons = (
    <div className="border border-slate-200/60 rounded-xl bg-white divide-y divide-slate-100 overflow-hidden shadow-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-20 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Base Donneurs</h1>
          <p className="text-sm text-slate-500">
            Consultez, filtrez et gérez l'ensemble des donneurs de votre centre.
          </p>
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher par nom ou téléphone..."
              className="pl-9 bg-white"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center border rounded-lg bg-white p-1 shadow-sm">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
              title="Affichage en Grille"
            >
              <Grid3X3 className="h-4 w-4 text-slate-600" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
              title="Affichage en Liste"
            >
              <List className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-2">Groupe sanguin :</span>
          <Button
            size="sm"
            variant={selectedBloodType === undefined ? "default" : "outline"}
            className={cn(
              "h-7 text-xs font-medium px-2.5 transition-all",
              selectedBloodType === undefined
                ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-200"
            )}
            onClick={() => setSelectedBloodType(undefined)}
          >
            Tous
          </Button>
          {BLOOD_TYPES.map((bt) => (
            <Button
              key={bt}
              size="sm"
              variant={selectedBloodType === bt ? "default" : "outline"}
              className={cn(
                "h-7 text-xs font-medium px-2.5 transition-all",
                selectedBloodType === bt
                  ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 border-slate-200"
              )}
              onClick={() => setSelectedBloodType(bt === selectedBloodType ? undefined : bt)}
            >
              {bt}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between border-b pb-2">
        <p className="text-sm font-semibold text-slate-500">
          {donors?.length ?? 0} résultat{((donors?.length ?? 0) !== 1) ? "s" : ""}
        </p>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        viewMode === "grid" ? gridSkeletons : listSkeletons
      ) : donors?.length ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {donors.map((donor) => (
              <DonorCard key={donor.id} donor={donor} />
            ))}
          </div>
        ) : (
          <div className="border border-slate-200/60 rounded-xl bg-white divide-y divide-slate-100 overflow-hidden shadow-sm">
            {donors.map((donor) => (
              <DonorListItem key={donor.id} donor={donor} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-medium text-slate-700">Aucun donneur trouvé</h3>
          <p className="text-sm text-slate-500 mt-1">
            Essayez de modifier vos critères de recherche ou de sélection de groupe.
          </p>
        </div>
      )}
    </div>
  );
}
