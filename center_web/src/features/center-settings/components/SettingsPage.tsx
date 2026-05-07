"use client";

import { useState } from "react";
import { Settings, Bell, Globe, Building2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTodayStats } from "@/features/center-dashboard/lib/hooks";

type Tab = "profile" | "preferences";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? "bg-rose-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

function ProfileTab() {
  const { data: stats, isLoading } = useTodayStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-rose-600" />
            Informations du centre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Nom du centre</label>
              <Input defaultValue={stats?.centerName ?? "Mon centre"} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Téléphone</label>
              <Input placeholder="+212 5XX XXX XXX" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Adresse</label>
              <Input placeholder="Adresse du centre" />
            </div>
          </div>
          <Button
            className="bg-rose-600 hover:bg-rose-700"
            onClick={() => toast.success("Profil mis à jour")}
          >
            Mettre à jour le profil
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-rose-600" />
            Statistiques rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">RDV aujourd'hui</p>
              <p className="text-xl font-bold text-slate-900">{stats?.todayAppointmentsCount ?? 0}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Dons validés</p>
              <p className="text-xl font-bold text-slate-900">{stats?.validatedDonationsCount ?? 0}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">En attente</p>
              <p className="text-xl font-bold text-slate-900">{stats?.pendingAppointmentsCount ?? 0}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Alertes actives</p>
              <p className="text-xl font-bold text-slate-900">{stats?.activeAlertsCount ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencesTab() {
  const [preferences, setPreferences] = useState({
    notifications: true,
    language: "fr",
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="h-4 w-4 text-rose-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Alertes de pénurie</p>
              <p className="text-xs text-slate-500">
                Recevoir une notification lors d'une nouvelle alerte
              </p>
            </div>
            <Toggle
              checked={preferences.notifications}
              onChange={() =>
                setPreferences((p) => ({ ...p, notifications: !p.notifications }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4 text-rose-600" />
            Langue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:ring-rose-500"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </CardContent>
      </Card>

      <Button
        className="bg-rose-600 hover:bg-rose-700"
        onClick={() => toast.success("Préférences enregistrées")}
      >
        <Settings className="mr-2 h-4 w-4" />
        Enregistrer les préférences
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500">Gérez votre centre et vos préférences</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "profile"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Building2 className="mr-1.5 h-4 w-4 inline" />
          Profil du centre
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "preferences"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <Settings className="mr-1.5 h-4 w-4 inline" />
          Préférences
        </button>
      </div>

      {activeTab === "profile" ? <ProfileTab /> : <PreferencesTab />}
    </div>
  );
}
