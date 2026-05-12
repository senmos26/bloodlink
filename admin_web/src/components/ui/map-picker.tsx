"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Fix default Leaflet icon
const icon = L.icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTExZDQ4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDEwYzAgNi04IDEwLTggMTBTNCAxNiA0IDEwYTggOCAwIDAgMCAxNiAwIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  className?: string;
  height?: string;
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
      map.setView([lat, lng], map.getZoom() ?? 13);
    }
  }, [lat, lng, map]);
  return null;
}

export function MapPicker({
  lat,
  lng,
  onChange,
  className,
  height = "h-64",
}: MapPickerProps) {
  const position: [number, number] =
    lat !== 0 || lng !== 0 ? [lat, lng] : [33.5731, -7.5898]; // Casablanca fallback

  return (
    <div className={cn("relative w-full rounded-lg overflow-hidden border", height, className)}>
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {(lat !== 0 || lng !== 0) && <Marker position={position} icon={icon} />}
        <MapController lat={lat} lng={lng} />
        <ClickHandler onClick={onChange} />
      </MapContainer>
      <div className="absolute bottom-2 right-2 z-[400] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-slate-500 shadow-sm pointer-events-none">
        <MapPin className="inline h-3 w-3 mr-1" />
        Cliquez sur la carte pour placer le marqueur
      </div>
    </div>
  );
}
