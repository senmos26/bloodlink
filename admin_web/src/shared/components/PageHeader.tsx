"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  action?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  count,
  countLabel = "résultats",
  action,
  onRefresh,
  isRefreshing,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-4", className)}>
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
            {count !== undefined && (
              <span className="ml-1 font-medium text-slate-700">
                {count.toLocaleString("fr-FR")} {countLabel}
              </span>
            )}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
