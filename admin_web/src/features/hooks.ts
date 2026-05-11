"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Dashboard hooks ────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// ─── Alert hooks ────────────────────────────────────────────────────

export function useAlerts(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["admin", "alerts", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/admin/alerts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
  });
}

export function useCloseAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch("/api/admin/alerts/close", {
        method: "POST",
        body: JSON.stringify({ alertId }),
      });
      if (!res.ok) throw new Error("Failed to close alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Alerte fermée avec succès.");
    },
    onError: () => toast.error("Impossible de fermer l'alerte."),
  });
}

export function useEscalateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch("/api/admin/alerts/escalate", {
        method: "POST",
        body: JSON.stringify({ alertId }),
      });
      if (!res.ok) throw new Error("Failed to escalate alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      toast.success("Alerte escaladée.");
    },
    onError: () => toast.error("Impossible d'escalader l'alerte."),
  });
}

export function useRelaunchAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch("/api/admin/alerts/relaunch", {
        method: "POST",
        body: JSON.stringify({ alertId }),
      });
      if (!res.ok) throw new Error("Failed to relaunch alert");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "alerts"] });
      toast.success("Alerte relancée.");
    },
    onError: () => toast.error("Impossible de relancer l'alerte."),
  });
}

// ─── Appointment hooks ──────────────────────────────────────────────

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      const res = await fetch("/api/admin/appointments/status", {
        method: "POST",
        body: JSON.stringify({ appointmentId, status }),
      });
      if (!res.ok) throw new Error("Failed to update appointment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Rendez-vous mis à jour.");
    },
    onError: () => toast.error("Impossible de mettre à jour le rendez-vous."),
  });
}

// ─── Donation hooks ──────────────────────────────────────────────────

export function useValidateDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (donationId: string) => {
      const res = await fetch("/api/admin/donations/validate", {
        method: "POST",
        body: JSON.stringify({ donationId }),
      });
      if (!res.ok) throw new Error("Failed to validate donation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "donations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Don validé.");
    },
    onError: () => toast.error("Impossible de valider le don."),
  });
}

export function useRejectDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ donationId, reason }: { donationId: string; reason?: string }) => {
      const res = await fetch("/api/admin/donations/reject", {
        method: "POST",
        body: JSON.stringify({ donationId, reason }),
      });
      if (!res.ok) throw new Error("Failed to reject donation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "donations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      toast.success("Don rejeté.");
    },
    onError: () => toast.error("Impossible de rejeter le don."),
  });
}
