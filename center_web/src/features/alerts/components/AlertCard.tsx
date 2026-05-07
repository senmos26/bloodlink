"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Clock,
  MoreVertical,
  Target,
  Users,
  ArrowUpCircle,
  Share2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Alert, UrgencyLevel, AlertStatus } from "@/entities";

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; color: string; bg: string; border: string; pulse: string }
> = {
  low: { label: "Basse", color: "text-muted-foreground", bg: "bg-secondary-light", border: "border-border", pulse: "" },
  medium: { label: "Moyenne", color: "text-warning", bg: "bg-warning/90", border: "border-warning/30", pulse: "" },
  high: { label: "Haute", color: "text-primary", bg: "bg-primary", border: "border-primary/30", pulse: "" },
  critical: { label: "VITALE", color: "text-white", bg: "bg-blood-red", border: "border-destructive/30", pulse: "animate-pulse" },
};

const STATUS_LABELS: Record<AlertStatus, string> = {
  active: "EN COURS",
  expired: "EXPIRÉE",
  closed: "CLÔTURÉE",
};

function CountdownBar({ deadline }: { deadline: string }) {
  const [hoursLeft, setHoursLeft] = useState(0);
  const [totalHours, setTotalHours] = useState(1);

  useEffect(() => {
    const deadlineDate = new Date(deadline);
    const createdDate = new Date(deadlineDate.getTime() - 48 * 60 * 60 * 1000);
    const update = () => {
      const now = new Date();
      const left = Math.max(0, (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      const total = Math.max(1, (deadlineDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
      setHoursLeft(left);
      setTotalHours(total);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  const pct = Math.max(0, Math.min(100, (hoursLeft / totalHours) * 100));
  const isUrgent = hoursLeft < 6;
  const isExpired = hoursLeft <= 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {isExpired ? "Expirée" : `${Math.round(hoursLeft)}h restantes`}
        </span>
        <span className={cn("text-xs font-bold", isUrgent && !isExpired ? "text-destructive" : "text-muted-foreground")}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isExpired ? "bg-muted-foreground/30" : isUrgent ? "bg-destructive" : pct > 50 ? "bg-success" : "bg-warning"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DonorProgress({ responded, needed }: { responded: number; needed: number }) {
  const pct = needed > 0 ? Math.min(100, (responded / needed) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          {responded}/{needed} donneurs
        </span>
        <span className={cn("text-xs font-bold", pct >= 100 ? "text-success" : "text-muted-foreground")}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct >= 100 ? "bg-success" : pct >= 50 ? "bg-primary/70" : "bg-warning"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface AlertCardProps {
  alert: Alert;
  onClose?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onRelaunch?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function AlertCard({ alert, onClose, onEscalate, onRelaunch, onShare }: AlertCardProps) {
  const urgency = URGENCY_CONFIG[alert.urgencyLevel];
  const isClosed = alert.status === "closed" || alert.status === "expired";

  return (
    <Card
      className={cn(
        "flex flex-col w-full h-full overflow-hidden transition-all duration-200 hover:shadow-lg border relative bg-background/95 backdrop-blur-sm",
        urgency.border
      )}
    >
      {/* Urgency banner */}
      <div className={cn("flex items-center gap-3 px-4 py-2.5 text-white", urgency.bg, urgency.pulse)}>
        <span className="text-2xl font-black tracking-tight">{alert.bloodTypeRequired}</span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest opacity-90">{urgency.label}</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-white/40 text-white bg-white/20">
          {STATUS_LABELS[alert.status]}
        </Badge>
      </div>

      <CardHeader className="pb-2 px-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-foreground leading-tight flex-1">
            {alert.message || "Aucun message"}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isClosed && (
                <>
                  <DropdownMenuItem onClick={() => onRelaunch?.(alert.id)}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" /> Relancer
                  </DropdownMenuItem>
                  {alert.urgencyLevel !== "critical" && (
                    <DropdownMenuItem onClick={() => onEscalate?.(alert.id)}>
                      <AlertTriangle className="mr-2 h-4 w-4" /> Escalader
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onShare?.(alert.id)}>
                    <Share2 className="mr-2 h-4 w-4" /> Partager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onClose?.(alert.id)} className="text-destructive">
                    <XCircle className="mr-2 h-4 w-4" /> Clôturer
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 pb-3 flex-1 space-y-3">
        {/* Countdown + Donor progress */}
        <CountdownBar deadline={alert.deadline} />
        <DonorProgress responded={alert.donorsResponded} needed={alert.donorsNeeded} />

        {/* Meta info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <Target className="h-3 w-3" /> Rayon : {alert.radiusKm} km
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Clock className="h-3 w-3" />{" "}
            {new Date(alert.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-2.5 border-t bg-muted/30">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            {alert.donorsResponded > 0 && (
              <Badge variant="secondary" className="text-[10px] font-bold gap-1">
                <Users className="h-3 w-3" /> {alert.donorsResponded} donneur{alert.donorsResponded > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {!isClosed && (
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-primary hover:bg-accent hover:text-primary-dark uppercase text-xs h-7"
              onClick={() => onClose?.(alert.id)}
            >
              Clôturer
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
