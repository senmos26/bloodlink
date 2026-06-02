"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X, Search } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterOption[];
  searchPlaceholder?: string;
  resultsCount?: number;
  className?: string;
}

export function FilterBar({
  filters,
  searchPlaceholder = "Rechercher...",
  resultsCount,
  className,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = React.useState(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("q") || "");

  const hasActiveFilters = React.useMemo(() => {
    const keys = Array.from(searchParams.keys()).filter((k) => k !== "page");
    return keys.length > 0;
  }, [searchParams]);

  const updateFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.replace(pathname);
    setSearchQuery("");
  };

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      const currentQ = searchParams.get("q") || "";
      if (trimmed === currentQ) return;
      if (trimmed.length === 0) {
        updateFilter("q", "");
      } else {
        updateFilter("q", trimmed);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn(isMobile ? "space-y-4" : "grid items-center gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]")}>
      {/* Search */}
      <div className={cn("relative", isMobile && "space-y-2")}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Select filters */}
      {filters.map((filter) => (
        <div key={filter.key} className={cn(isMobile && "space-y-2")}>
          <Select
            value={searchParams.get(filter.key) || ""}
            onValueChange={(value) => updateFilter(filter.key, value)}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop: Collapsible */}
      <div className="hidden md:block">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="font-semibold text-rose-700 hover:text-rose-800">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {isOpen ? "Masquer les filtres" : "Afficher les filtres"}
                {hasActiveFilters && !isOpen && <span className="ml-2 h-2 w-2 rounded-full bg-rose-500" />}
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-3">
              {resultsCount !== undefined && (
                <span className="text-sm text-slate-500">
                  {resultsCount.toLocaleString("fr-FR")} résultat{resultsCount !== 1 ? "s" : ""}
                </span>
              )}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-600">
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
          <CollapsibleContent className="pt-4">
            <Separator className="mb-4" />
            <FilterContent />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Mobile: Sheet */}
      <div className="md:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-center h-12 border-2">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtres
              {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-rose-500" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
            <SheetHeader className="px-0 py-2">
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="pb-4">
                <FilterContent isMobile />
              </div>
            </ScrollArea>
            {hasActiveFilters && (
              <div className="px-0 py-3 border-t">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full h-10">
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
