"use client";

import { useState } from "react";
import { HeartPulse, CheckCircle2, Droplets, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTodayDonations,
  useCompletedAppointments,
  useCreateDonation,
} from "@/features/donations/lib/hooks";
import type { Donation } from "@/entities";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DonationsPage() {
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const { data: appointments, isLoading: apptsLoading } = useCompletedAppointments();
  const { data: donations, isLoading: donationsLoading } = useTodayDonations();
  const createDonation = useCreateDonation();

  const selectedApptData = appointments?.find((a: { id: string }) => a.id === selectedAppt);

  const filteredAppointments = appointments?.filter(
    (a: { donorFullName: string | null }) =>
      !search || a.donorFullName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDonations = donations?.filter(
    (d: Donation) =>
      !search || d.donorFullName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateDonation = () => {
    if (!selectedAppt) return;
    createDonation.mutate(
      { appointmentId: selectedAppt, notes: notes || undefined },
      {
        onSuccess: () => {
          setSelectedAppt(null);
          setNotes("");
          toast.success("Don validé avec succès");
        },
        onError: () => {
          toast.error("Erreur lors de la validation");
        },
      }
    );
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dons & Prélèvements</h1>
          <p className="text-sm text-slate-500">
            {donations?.length ?? 0} dons validés aujourd'hui
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Rendez-vous terminés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {apptsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : filteredAppointments?.length ? (
              filteredAppointments.map((appt: { id: string; donorFullName: string | null; donorBloodType: string | null; scheduledDate: string }) => (
                <button
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-all",
                    selectedAppt === appt.id
                      ? "border-rose-400 bg-rose-50 shadow-sm"
                      : "hover:bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {appt.donorFullName ?? "Donneur"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {appt.donorBloodType && (
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                            {appt.donorBloodType}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(appt.scheduledDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    {selectedAppt === appt.id && (
                      <Badge className="bg-rose-600">Sélectionné</Badge>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Aucun rendez-vous terminé aujourd'hui
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Droplets className="h-4 w-4 text-rose-600" />
              Créer le don
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAppt ? (
              <>
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                  <p className="text-xs text-rose-600 font-medium">Donneur sélectionné</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedApptData?.donorFullName ?? "Donneur"}
                  </p>
                  {selectedApptData?.donorBloodType && (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 mt-1">
                      {selectedApptData.donorBloodType}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">Notes (optionnel)</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes sur le don..."
                  />
                </div>
                <Button
                  className="w-full bg-rose-600 hover:bg-rose-700"
                  onClick={handleCreateDonation}
                  disabled={createDonation.isPending}
                >
                  {createDonation.isPending ? "Validation..." : "Valider le don (450 mL)"}
                </Button>
              </>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                Sélectionnez un rendez-vous terminé pour créer le don
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <HeartPulse className="h-4 w-4 text-rose-600" />
            Dons validés aujourd'hui
          </CardTitle>
        </CardHeader>
        <CardContent>
          {donationsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg mb-2" />
            ))
          ) : filteredDonations?.length ? (
            <div className="divide-y divide-slate-100">
              {filteredDonations.map((donation: Donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-rose-100 p-2">
                      <Droplets className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {donation.donorFullName ?? "Donneur"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {donation.volumeMl ?? 450} mL — {donation.donorBloodType ?? "—"}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border">
                    Validé
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              Aucun don validé aujourd'hui
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
