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
  const [context, setContext] = useState<AdminContext | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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

        setContext(adminContext);
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

  async function refreshDonations(currentContext: AdminContext) {
    const query =
      currentContext.role === "center_admin" && currentContext.center
        ? supabase.from("donations").select("*").eq("center_id", currentContext.center.id)
        : supabase.from("donations").select("*");

    const { data, error: fetchError } = await query.order("donation_date", { ascending: false });
    if (fetchError) throw fetchError;
    setDonations(Array.isArray(data) ? (data as Donation[]) : []);
  }

  async function handleCreateDonation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context) return;

    setCreating(true);
    setError(null);

    try {
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .single<Appointment>();

      if (appointmentError || !appointment) {
        throw new Error("Rendez-vous introuvable.");
      }

      if (context.role === "center_admin" && context.center && appointment.center_id !== context.center.id) {
        throw new Error("Ce rendez-vous n'appartient pas à votre centre.");
      }

      const now = new Date().toISOString();
      const { error: insertError } = await supabase.from("donations").insert({
        donor_id: appointment.donor_id,
        center_id: appointment.center_id,
        appointment_id: appointment.id,
        donation_date: now,
        volume_ml: 450,
        status: "validated",
        validated_by: context.profile.id,
        validated_at: now,
        notes: notes || null,
      });

      if (insertError) throw insertError;

      const { error: updateAppointmentError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointment.id);

      if (updateAppointmentError) throw updateAppointmentError;

      await refreshDonations(context);
      setAppointmentId("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création du don impossible.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(donation: Donation, status: DonationStatus) {
    if (!context) return;

    try {
      const payload: Partial<Donation> & { status: DonationStatus } = { status };

      if (status === "validated") {
        payload.validated_by = context.profile.id;
        payload.validated_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase.from("donations").update(payload).eq("id", donation.id);
      if (updateError) throw updateError;
      await refreshDonations(context);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible.");
    }
  }

  const profileMap = new Map(profiles.map((item) => [item.id, item.full_name]));
  const centerMap = new Map(centers.map((item) => [item.id, item.name]));
  const isCenterAdmin = context?.role === "center_admin" && !!context.center;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Dons</h1>
        {isCenterAdmin ? (
          <p className="mt-3 text-sm text-slate-600">
            Centre associé : {context?.center?.name ?? "Centre inconnu"} — {context?.center?.city ?? "Ville inconnue"}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-slate-500">Validez un don depuis un rendez-vous et mettez à jour son statut.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={handleCreateDonation} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Créer un don depuis un rendez-vous</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            <span className="mb-2 block font-medium">Appointment ID</span>
            <input value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400" placeholder="UUID du rendez-vous" required />
          </label>
          <label className="text-sm text-slate-700">
            <span className="mb-2 block font-medium">Notes</span>
            <input value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-red-400" placeholder="Notes optionnelles" />
          </label>
        </div>
        <button type="submit" disabled={creating || loading} className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-70">
          {creating ? "Validation..." : "Créer et valider le don"}
        </button>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : Array.isArray(donations) && donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.id} className="rounded-2xl border border-slate-200 px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{formatDateTime(donation.donation_date)}</p>
                    <p className="mt-1 text-sm text-slate-500">Donneur: {profileMap.get(donation.donor_id) ?? donation.donor_id}</p>
                    <p className="mt-1 text-sm text-slate-500">Centre: {centerMap.get(donation.center_id) ?? donation.center_id}</p>
                    <p className="mt-1 text-sm text-slate-500">Volume: {donation.volume_ml} mL</p>
                  </div>
                  <div className="min-w-40">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Statut</label>
                    <select value={donation.status} onChange={(event) => handleStatusChange(donation, event.target.value as DonationStatus)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400">
                      {donationStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>Appointment ID: {donation.appointment_id ?? "Aucun"}</p>
                  <p>Validé par: {donation.validated_by ?? "Non renseigné"}</p>
                  <p>Validé le: {donation.validated_at ? new Date(donation.validated_at).toLocaleString("fr-FR") : "Non renseigné"}</p>
                  <p>Notes: {donation.notes || "Aucune note"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            {isCenterAdmin ? "Aucun don pour ce centre." : "Aucun don disponible."}
          </p>
        )}
      </div>
    </div>
  );
}
