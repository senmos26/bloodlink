"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bell, AlertTriangle, Users, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertStats } from "@/features/alerts/lib/actions";

interface AlertStatsBoardProps {
  stats?: AlertStats;
  isLoading?: boolean;
}

const statCards: {
  key: keyof AlertStats;
  title: string;
  subtitle: string;
  icon: typeof Bell;
  color: string;
  bgColor: string;
  format: (v: number) => string;
}[] = [
  {
    key: "totalActive",
    title: "Alertes actives",
    subtitle: "Toutes les alertes en cours de diffusion",
    icon: Bell,
    color: "text-primary",
    bgColor: "bg-accent",
    format: (v) => String(v),
  },
  {
    key: "criticalCount",
    title: "Critiques",
    subtitle: "Alertes avec urgence vitale nécessitant une action immédiate",
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    format: (v) => String(v),
  },
  {
    key: "responseRate",
    title: "Taux de réponse",
    subtitle: "Pourcentage d'alertes ayant reçu au moins un donneur",
    icon: Users,
    color: "text-success",
    bgColor: "bg-success/10",
    format: (v) => `${v}%`,
  },
  {
    key: "avgResponseTime",
    title: "Temps moyen",
    subtitle: "Délai moyen entre la publication et la première réponse",
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    format: (v) => `${v}h`,
  },
];

export function AlertStatsBoard({ stats, isLoading }: AlertStatsBoardProps) {
  const safeStats: AlertStats = stats ?? {
    totalActive: 0,
    criticalCount: 0,
    responseRate: 0,
    avgResponseTime: 0,
    expiredToday: 0,
    donorsResponded: 0,
  };

  return (
    <TooltipProvider delayDuration={100}>
      <section>
        <div className="flex overflow-x-auto space-x-4 pb-2 sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-4 sm:space-x-0 items-stretch">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className="min-w-[220px] flex-shrink-0 sm:min-w-0">
                <Card
                  className={cn(
                    "relative overflow-hidden border bg-white/90 backdrop-blur-sm shadow-sm h-full w-full",
                    isLoading && "opacity-70 animate-pulse"
                  )}
                >
                  <CardHeader className="pb-2 px-4">
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 flex-1 min-w-0">
                        <span className={cn("flex items-center justify-center w-7 h-7 rounded-md", card.bgColor, card.color)}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="truncate">{card.title}</span>
                      </CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-1 hover:bg-slate-50 focus:outline-none shrink-0"
                          >
                            <Info className="w-4 h-4 text-muted-foreground/50" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">{card.subtitle}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col items-center justify-center pt-1 pb-4 px-4">
                    <div className="text-3xl font-bold text-foreground">
                      {isLoading ? "--" : card.format(safeStats[card.key])}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center leading-snug line-clamp-2">
                      {card.subtitle}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </section>
    </TooltipProvider>
  );
}
