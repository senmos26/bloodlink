"use client";

import type { Alert, UrgencyLevel, AlertStatus } from "@/entities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XCircle, ArrowUpCircle, Share2 } from "lucide-react";

const URGENCY_STYLES: Record<UrgencyLevel, { label: string; color: string; bg: string }> = {
  low: { label: "Basse", color: "text-muted-foreground", bg: "bg-muted" },
  medium: { label: "Moyenne", color: "text-warning", bg: "bg-warning/10" },
  high: { label: "Haute", color: "text-primary", bg: "bg-accent" },
  critical: { label: "Vitale", color: "text-destructive", bg: "bg-destructive/10" },
};

interface AlertTableViewProps {
  alerts: Alert[];
  onClose?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function AlertTableView({ alerts, onClose, onEscalate, onShare }: AlertTableViewProps) {
  if (alerts.length === 0) {
    return (
      <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aucune alerte trouvée</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="w-[80px] font-bold text-xs">Groupe</TableHead>
            <TableHead className="font-bold text-xs">Urgence</TableHead>
            <TableHead className="font-bold text-xs">Message</TableHead>
            <TableHead className="w-[100px] font-bold text-xs">Donneurs</TableHead>
            <TableHead className="w-[80px] font-bold text-xs">Rayon</TableHead>
            <TableHead className="w-[100px] font-bold text-xs">Statut</TableHead>
            <TableHead className="w-[120px] font-bold text-xs">Date</TableHead>
            <TableHead className="w-[80px] font-bold text-xs text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => {
            const urgency = URGENCY_STYLES[alert.urgencyLevel];
            const isClosed = alert.status === "closed" || alert.status === "expired";
            return (
              <TableRow key={alert.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <Badge className="bg-primary text-primary-foreground font-bold text-sm">{alert.bloodTypeRequired}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-bold text-xs", urgency.color, urgency.bg, `border-${alert.urgencyLevel === "critical" ? "red" : "slate"}-200`)}>
                    {urgency.label}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{alert.message || "—"}</TableCell>
                <TableCell className="text-sm">
                  <span className="font-bold">{alert.donorsResponded}</span>
                  <span className="text-muted-foreground">/{alert.donorsNeeded}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{alert.radiusKm} km</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-bold",
                      alert.status === "active" && "text-success bg-success/10 border-success/20",
                      alert.status === "expired" && "text-muted-foreground bg-muted border-border",
                      alert.status === "closed" && "text-muted-foreground/60 bg-muted border-border"
                    )}
                  >
                    {alert.status === "active" ? "Active" : alert.status === "expired" ? "Expirée" : "Clôturée"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!isClosed && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEscalate?.(alert.id)}>
                          <ArrowUpCircle className="h-4 w-4 text-warning" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onShare?.(alert.id)}>
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onClose?.(alert.id)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
