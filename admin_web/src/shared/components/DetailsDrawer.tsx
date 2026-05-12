"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: DetailField[];
  actions?: React.ReactNode;
  className?: string;
}

export function DetailsDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  fields,
  actions,
  className,
}: DetailsDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className={cn("w-full sm:max-w-md", className)}>
        <SheetHeader className="pb-2">
          <SheetTitle>{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
        </SheetHeader>

        {actions && (
          <>
            <div className="flex items-center gap-2 py-3">{actions}</div>
            <Separator />
          </>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {fields.map((field, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {field.label}
                </p>
                <div className="mt-1 text-sm text-slate-700">{field.value}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
