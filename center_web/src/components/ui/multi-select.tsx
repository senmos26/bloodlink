"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

interface MultiSelectOption {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCreate?: boolean;
  required?: boolean;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  allowCreate = false,
  required = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customOptions, setCustomOptions] = useState<MultiSelectOption[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allOptions = [...options, ...customOptions];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleCreate = () => {
    if (searchTerm.trim() && allowCreate) {
      const newOption = { value: searchTerm.trim(), text: searchTerm.trim() };
      setCustomOptions([...customOptions, newOption]);
      onChange([...value, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  const filteredOptions = allOptions.filter((option) =>
    option.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreate =
    allowCreate &&
    searchTerm.trim() &&
    !allOptions.some((opt) => opt.text.toLowerCase() === searchTerm.toLowerCase());

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div
          className={`min-h-[38px] w-full rounded-md border border-input bg-white px-3 py-1.5 cursor-pointer transition-all ${isOpen
            ? "border-accent ring-2 ring-accent/20 shadow-sm"
            : "hover:border-accent/40 hover:shadow-sm"
            }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-2 flex-1">
                {value.map((val) => {
                  const option = allOptions.find((opt) => opt.value === val);
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 pl-1 pr-0.5 py-0 bg-accent/15 text-primary rounded-md text-[10px] font-medium border border-accent/20 shadow-sm"
                    >
                      <span className="scale-50 origin-center -ml-1">🏷️</span>
                      <span>{option?.text || val}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(val);
                        }}
                        className="hover:bg-accent/30 rounded-full p-0.5 transition-colors -mr-1 ml-0.5"
                      >
                        <X className="h-3 w-3 text-primary" strokeWidth={3} />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <span className="text-lg">🏷️</span>
                {placeholder}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? "transform rotate-180" : ""
                }`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-input bg-white shadow-xl max-h-72 overflow-hidden">
            <div className="sticky top-0 bg-white p-3 border-b border-input/50">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canCreate) {
                      e.preventDefault();
                      handleCreate();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setIsOpen(false);
                      setSearchTerm("");
                    }
                  }}
                  placeholder="Rechercher dans les tags..."
                  className="w-full px-3 py-2 pr-8 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-2 max-h-56 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <div className="space-y-1">
                  {filteredOptions.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleOption(option.value)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-all ${isSelected
                          ? "bg-accent/10 hover:bg-accent/20 border border-accent/20"
                          : "hover:bg-gray-100"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🏷️</span>
                          <span className={isSelected ? "font-medium text-primary" : ""}>
                            {option.text}
                          </span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : searchTerm ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Aucun tag trouvé pour &quot;{searchTerm}&quot;
                  </p>
                  {allowCreate && (
                    <p className="text-xs text-muted-foreground">
                      Tapez Entrée pour créer ce tag
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {options.length === 0
                      ? "Aucun tag disponible"
                      : "Commencez à taper pour rechercher"}
                  </p>
                </div>
              )}

              {canCreate && (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md bg-accent/5 hover:bg-accent/10 border border-accent/10 transition-colors text-left mt-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                >
                  <span className="text-lg">➕</span>
                  <span className="text-accent font-medium text-sm">
                    Créer &quot;{searchTerm}&quot;
                  </span>
                </button>
              )}
            </div>

            {filteredOptions.length > 0 && (
              <div className="px-3 py-2 border-t border-input/50 bg-gray-50 text-xs text-muted-foreground">
                {value.length > 0 ? (
                  <span>
                    {value.length} tag{value.length > 1 ? "s" : ""} sélectionné
                    {value.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span>
                    {filteredOptions.length} tag
                    {filteredOptions.length > 1 ? "s" : ""} disponible
                    {filteredOptions.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
