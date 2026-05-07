"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Plus, Bell, CalendarDays, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const locale = useLocale();

  const actions = [
    {
      label: "Nouveau RDV",
      href: `/${locale}/appointments`,
      icon: CalendarDays,
      color: "text-blue-600",
      bg: "bg-blue-50 hover:bg-blue-100",
    },
    {
      label: "Enregistrer don",
      href: `/${locale}/donations`,
      icon: Droplets,
      color: "text-rose-600",
      bg: "bg-rose-50 hover:bg-rose-100",
    },
    {
      label: "Créer alerte",
      href: `/${locale}/alerts`,
      icon: Bell,
      color: "text-purple-600",
      bg: "bg-purple-50 hover:bg-purple-100",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <Button
            variant="outline"
            className={`gap-2 ${action.bg} ${action.color} border-0 font-medium`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
