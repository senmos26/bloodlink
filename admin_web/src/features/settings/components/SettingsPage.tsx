"use client";

import * as React from "react";
import {
  User,
  Phone,
  Mail,
  Shield,
  Droplets,
  CalendarDays,
  Save,
  Lock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/shared/components/PageHeader";
import { updateAdminProfile, sendPasswordReset } from "@/features/auth/lib/actions";

interface ProfileData {
  id: string;
  full_name: string;
  phone: string | null;
  email?: string;
  role: string;
  blood_type?: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  center_admin: "Centre Admin",
  donor: "Donneur",
};

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  super_admin: "default",
  center_admin: "secondary",
  donor: "outline",
};

interface SettingsPageProps {
  profile: ProfileData;
}

export function SettingsPageClient({ profile: initialProfile }: SettingsPageProps) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [fullName, setFullName] = React.useState(initialProfile.full_name);
  const [phone, setPhone] = React.useState(initialProfile.phone || "");
  const [saving, setSaving] = React.useState(false);
  const [resettingPassword, setResettingPassword] = React.useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateAdminProfile({ full_name: fullName, phone: phone || null });
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Profil mis à jour.");
      setProfile((prev) => ({ ...prev, full_name: fullName, phone: phone || null }));
    }
    setSaving(false);
  }

  async function handlePasswordReset() {
    setResettingPassword(true);
    const result = await sendPasswordReset();
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Email de réinitialisation envoyé.");
    }
    setResettingPassword(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Paramètres"
        description="Gérez vos informations de profil et votre compte."
      />

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Nom complet</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFullName(profile.full_name);
                  setPhone(profile.phone || "");
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-500" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <span className="font-medium text-slate-900">{profile.email || "—"}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Rôle
              </span>
              <Badge variant={ROLE_COLORS[profile.role] || "outline"}>
                {ROLE_LABELS[profile.role] || profile.role}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" /> Inscrit le
              </span>
              <span className="font-medium text-slate-900">{formatDate(profile.created_at)}</span>
            </div>

            {profile.blood_type && (
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <Droplets className="h-3.5 w-3.5" /> Groupe sanguin
                </span>
                <span className="font-bold text-rose-600">{profile.blood_type}</span>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <Button
            variant="outline"
            size="sm"
            onClick={handlePasswordReset}
            disabled={resettingPassword}
          >
            <Lock className="mr-2 h-4 w-4" />
            {resettingPassword ? "Envoi..." : "Changer le mot de passe"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
