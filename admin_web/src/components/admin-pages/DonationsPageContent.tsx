"use client";

import { useEffect, useState } from "react";

import { getCurrentAdminContext, type AdminContext } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Appointment, Center, Donation, DonationStatus, Profile } from "@/types/database";

const donationStatuses: DonationStatus[] = ["pending", "validated", "rejected"];

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Date indisponible";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date indisponible" : date.toLocaleString("fr-FR");
}

export default function DonationsPageContent() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDonations() {
      try {
        const adminContext = await getCurrentAdminContext();
        const query =
          adminContext.role === "center_admin" && adminContext.center
            ? supabase.from("donations").select("*").eq("center_id", adminContext.center.id)
            : supabase.from("donations").select("*");

        const { data, error: donationsError } = await query.order("donation_date", { ascending: false });
        if (donationsError) throw donationsError;

        const rows = Array.isArray(data) ? (data as Donation[]) : [];
        const donorIds = Array.from(new Set(rows.map((item) => item.donor_id)));
        const centerIds = Array.from(new Set(rows.map((item) => item.center_id)));

        const [profilesRes, centersRes] = await Promise.all([
          donorIds.length > 0 ? supabase.from("profiles").select("*").in("id", donorIds) : Promise.resolve({ data: [], error: null }),
          centerIds.length > 0 ? supabase.from("centers").select("*").in("id", centerIds) : Promise.resolve({ data: [], error: null }),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (centersRes.error) throw centersRes.error;
        if (!active) return;

        setDonations(rows);
        setProfiles(Array.isArray(profilesRes.data) ? (profilesRes.data as Profile[]) : []);
        setCenters(Array.isArray(centersRes.data) ? (centersRes.data as Center[]) : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Chargement des dons impossible.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDonations();

    return () => {
      active = false;
    };
  }, []);

  const profileMap = new Map(profiles.map((item) => [item.id, item.full_name]));
  const centerMap = new Map(centers.map((item) => [item.id, item.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Supervision des Dons</h1>
        <p className="mt-2 text-sm text-slate-500">Vue d&apos;ensemble de tous les dons enregistrés sur la plateforme.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(donations) && donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => {
              const donorName = profileMap.get(donation.donor_id) ?? donation.donor_id;
              const centerName = centerMap.get(donation.center_id) ?? donation.center_id;

              return (
              <div key={donation.id} className="rounded-2xl border border-slate-200 px-5 py-5 transition hover:border-rose-100 hover:bg-rose-50/10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{formatDateTime(donation.donation_date)}</p>
                    <p className="mt-1 text-sm text-slate-500">Donneur: {donorName}</p>
                    <p className="mt-1 text-sm text-slate-500">Centre: {centerName}</p>
                    <p className="mt-1 text-sm text-slate-500">Volume: {donation.volume_ml} mL</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                      donation.status === "validated" ? "bg-emerald-100 text-emerald-700" :
                      donation.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {donation.status}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 md:grid-cols-2">
                  <p><span className="font-medium">Rendez-vous ID:</span> {donation.appointment_id ?? "Direct"}</p>
                  <p><span className="font-medium">Validé par:</span> {donation.validated_by ?? "N/A"}</p>
                  <p><span className="font-medium">Date validation:</span> {donation.validated_at ? new Date(donation.validated_at).toLocaleString("fr-FR") : "N/A"}</p>
                  <p><span className="font-medium">Notes:</span> {donation.notes || "Aucune note"}</p>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Aucun don disponible.
          </p>
        )}
      </div>
    </div>
  );
}
