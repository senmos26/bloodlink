"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, LocateFixed, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const markerIcon = L.icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTExZDQ4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDEwYzAgNi04IDEwLTggMTBTNCAxNiA0IDEwYTggOCAwIDAgMCAxNiAwIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export interface ParsedAddress {
  addressLine1: string;
  city: string;
  lat: number;
  lng: number;
  displayName?: string;
}

interface LocationPickerProps {
  value?: ParsedAddress | null;
  onChange: (data: ParsedAddress | null) => void;
  className?: string;
  mapHeight?: string;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    if (lat !== 0 || lng !== 0) {
      map.setView([lat, lng], 16);
    }
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ value, onChange, className, mapHeight = "h-64" }: LocationPickerProps) {
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [locating, setLocating] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const lat = value?.lat ?? 0;
  const lng = value?.lng ?? 0;
  const position: [number, number] = lat || lng ? [lat, lng] : [33.5731, -7.5898];

  // Close results on outside click
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setShowResults(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
        { headers: { "User-Agent": "BloodLink/1.0" } }
      );
      const data = await res.json();
      setResults(data || []);
      setShowResults(true);
    } catch {
      toast.error("Erreur de recherche d'adresse.");
    }
    setSearching(false);
  }

  async function handleSelectResult(result: any) {
    setShowResults(false);
    setQuery(result.display_name || "");

    const addr = result.address || {};
    const parsed: ParsedAddress = {
      addressLine1: addr.road
        ? `${addr.road}${addr.house_number ? " " + addr.house_number : ""}`
        : result.display_name?.split(",")[0] || "",
      city: addr.city || addr.town || addr.village || addr.county || "",
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    };
    onChange(parsed);
  }

  async function handleLocateMe() {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { "User-Agent": "BloodLink/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const parsed: ParsedAddress = {
            addressLine1: addr.road
              ? `${addr.road}${addr.house_number ? " " + addr.house_number : ""}`
              : data.display_name?.split(",")[0] || "",
            city: addr.city || addr.town || addr.village || addr.county || "",
            lat,
            lng,
            displayName: data.display_name,
          };
          setQuery(data.display_name || "");
          onChange(parsed);
        } catch {
          onChange({ addressLine1: "", city: "", lat, lng });
        }
        setLocating(false);
      },
      () => {
        toast.error("Impossible d'obtenir votre position.");
        setLocating(false);
      }
    );
  }

  function handleMapClick(lat: number, lng: number) {
    onChange({
      addressLine1: value?.addressLine1 || "",
      city: value?.city || "",
      lat,
      lng,
    });
  }

  return (
    <div ref={wrapperRef} className={cn("space-y-3", className)}>
      {/* Search + Locate */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Rechercher une adresse..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setShowResults(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="pr-9"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>

          {/* Results dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b last:border-b-0"
                  onClick={() => handleSelectResult(r)}
                >
                  <div className="font-medium text-slate-900 truncate">{r.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleLocateMe}
          disabled={locating}
          className="shrink-0 h-10 w-10"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
      </div>

      {/* Map */}
      <div className={cn("relative w-full rounded-lg overflow-hidden border", mapHeight)}>
        <MapContainer center={position} zoom={lat || lng ? 16 : 12} scrollWheelZoom className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {(lat !== 0 || lng !== 0) && <Marker position={position} icon={markerIcon} />}
          <MapController lat={lat} lng={lng} />
          <ClickHandler onClick={handleMapClick} />
        </MapContainer>
        <div className="absolute bottom-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-slate-500 shadow-sm pointer-events-none">
          <MapPin className="inline h-3 w-3 mr-1" />
          Cliquez sur la carte pour affiner
        </div>
      </div>

      {/* Coordinates */}
      {lat !== 0 && lng !== 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Lat:</span>
          <span className="text-slate-600">{lat.toFixed(6)}</span>
          <span className="mx-1">|</span>
          <span>Lng:</span>
          <span className="text-slate-600">{lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}
