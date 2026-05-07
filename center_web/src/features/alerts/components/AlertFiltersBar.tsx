"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, X, RotateCw, LayoutGrid, Rows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const URGENCY_OPTIONS = [
  { value: "all", label: "Toutes" },
  { value: "critical", label: "Vitale" },
  { value: "high", label: "Haute" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Basse" },
];
const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actives" },
  { value: "expired", label: "Expirées" },
  { value: "closed", label: "Clôturées" },
];

export interface AlertFilterState {
  searchTerm: string;
  bloodType: string;
  urgency: string;
  status: string;
}

export interface AlertFilterHandlers {
  handleSearchChange: (val: string) => void;
  handleBloodTypeChange: (val: string) => void;
  handleUrgencyChange: (val: string) => void;
  handleStatusChange: (val: string) => void;
  handleClearFilters: () => void;
}

interface AlertFiltersBarProps {
  filters: AlertFilterState;
  handlers: AlertFilterHandlers;
  hasActiveFilters: boolean;
  filteredCount: number;
  isFetching?: boolean;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
}

export function AlertFiltersBar({
  filters,
  handlers,
  hasActiveFilters,
  filteredCount,
  isFetching,
  viewMode,
  onViewModeChange,
}: AlertFiltersBarProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [inputValue, setInputValue] = useState(filters.searchTerm);
  const isDesktop = typeof window !== "undefined" ? window.innerWidth >= 768 : true;

  useEffect(() => {
    setInputValue(filters.searchTerm);
  }, [filters.searchTerm]);

  const filterFields = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="relative w-full">
        <Input
          placeholder="Rechercher une alerte..."
          className="w-full pr-8"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handlers.handleSearchChange(e.target.value);
          }}
        />
        {inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              handlers.handleSearchChange("");
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : isFetching ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <RotateCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </div>

      <Select value={filters.bloodType} onValueChange={handlers.handleBloodTypeChange}>
        <SelectTrigger className="w-full h-10 text-sm px-3">
          <SelectValue placeholder="Groupe sanguin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les groupes</SelectItem>
          {BLOOD_TYPES.map((bt) => (
            <SelectItem key={bt} value={bt}>{bt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.urgency} onValueChange={handlers.handleUrgencyChange}>
        <SelectTrigger className="w-full h-10 text-sm px-3">
          <SelectValue placeholder="Urgence" />
        </SelectTrigger>
        <SelectContent>
          {URGENCY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={handlers.handleStatusChange}>
        <SelectTrigger className="w-full h-10 text-sm px-3">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* View mode toggle */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/70 px-2 py-1 shadow-sm">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("grid")}
            className="h-9 w-9"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("table")}
            className="h-9 w-9"
          >
            <Rows className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">
            {filteredCount} résultat{filteredCount !== 1 ? "s" : ""}
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlers.handleClearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {isDesktop ? (
        <Collapsible
          open={isFiltersOpen}
          onOpenChange={setIsFiltersOpen}
          className="p-2 sm:p-3 bg-white border rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold text-primary hover:text-primary-dark"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {isFiltersOpen ? "Masquer les filtres" : "Afficher les filtres"}
                {hasActiveFilters && !isFiltersOpen && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-2">
            <Separator className="mb-2" />
            {filterFields}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-center font-semibold text-sm py-3 h-12 border-2"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <span className="truncate">Filtres</span>
              {hasActiveFilters && (
                <span className="ml-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="px-4 py-3">
              <DrawerTitle className="text-lg">Filtres</DrawerTitle>
            </DrawerHeader>
            <ScrollArea className="flex-1 overflow-y-auto px-4">
              <div className="pb-4 space-y-4">{filterFields}</div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
