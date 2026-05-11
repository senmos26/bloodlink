"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Dashboard data actions ─────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  // Run all queries in parallel for performance
  const [
    profilesResult,
    centersResult,
    alertsResult,
    donationsResult,
    appointmentsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("role, is_active, blood_type", { count: "exact", head: false }),
    supabase.from("centers").select("is_active", { count: "exact", head: false }),
    supabase.from("alerts").select("status, urgency_level", { count: "exact", head: false }),
    supabase.from("donations").select("status, donation_date", { count: "exact", head: false }),
    supabase.from("appointments").select("status, scheduled_date", { count: "exact", head: false }),
  ]);

  const profiles = profilesResult.data || [];
  const centers = centersResult.data || [];
  const alerts = alertsResult.data || [];
  const donations = donationsResult.data || [];
  const appointments = appointmentsResult.data || [];

  // Compute KPIs
  const today = new Date().toISOString().split("T")[0];

  const totalDonors = profiles.filter((p) => p.role === "donor" && p.is_active).length;
  const totalCenters = centers.filter((c) => c.is_active).length;
  const activeAlerts = alerts.filter((a) => a.status === "active").length;
  const criticalAlerts = alerts.filter((a) => a.status === "active" && a.urgency_level === "critical").length;
  const validatedDonations = donations.filter((d) => d.status === "validated").length;
  const pendingDonations = donations.filter((d) => d.status === "pending").length;
  const todayAppointments = appointments.filter((a) => a.scheduled_date?.startsWith(today)).length;
  const pendingAppointments = appointments.filter((a) => a.status === "pending").length;

  // Blood type distribution
  const bloodTypeCounts: Record<string, number> = {};
  profiles
    .filter((p) => p.blood_type && p.is_active && p.role === "donor")
    .forEach((p) => {
      bloodTypeCounts[p.blood_type!] = (bloodTypeCounts[p.blood_type!] || 0) + 1;
    });

  // Donations by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyDonations: Record<string, number> = {};
  donations
    .filter((d) => d.donation_date && new Date(d.donation_date) >= sixMonthsAgo)
    .forEach((d) => {
      const month = d.donation_date.substring(0, 7); // YYYY-MM
      monthlyDonations[month] = (monthlyDonations[month] || 0) + 1;
    });

  return {
    totalDonors,
    totalCenters,
    activeAlerts,
    criticalAlerts,
    validatedDonations,
    pendingDonations,
    todayAppointments,
    pendingAppointments,
    bloodTypeCounts,
    monthlyDonations,
  };
}

export async function getRecentAlerts(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("alerts")
    .select("*, centers(name, city)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { data };
}

export async function getRecentAppointments(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select("*, profiles:donor_id(full_name, blood_type), centers:center_id(name)")
    .order("scheduled_date", { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { data };
}
