"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#1c3ab3;border:3px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// MapContainer's `center` prop only applies on first mount (react-leaflet
// doesn't re-pan on prop changes) — this imperatively recenters the view
// when the caller picks a region/city from the wizard's dropdowns, without
// re-centering on every ordinary pin click/drag (those don't touch flyTo).
// Uses setView rather than flyTo — flyTo's animated pan never completed
// reliably (confirmed via direct map instance inspection: the animation
// call returned normally but the view snapped back to its prior center),
// so an instant jump beats a broken animation.
function FlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([target.lat, target.lng], target.zoom ?? 12);
  }, [map, target.lat, target.lng, target.zoom]);
  return null;
}

// Single-marker picker: click anywhere to move the pin, or drag it —
// used by the intake wizard's location step (app/admin/properties/new).
// PropertyMap (components/map/PropertyMap.tsx) stays read-only/multi-marker
// for the general map view; this is a separate, focused component since
// the interaction model is different enough not to bolt onto that one.
export function LocationPicker({
  lat,
  lng,
  onChange,
  flyTo,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  // Set by the caller when a region/city dropdown picks a new place —
  // pans the map there without moving the pin on its own (the caller
  // updates lat/lng separately if it wants the pin to follow).
  flyTo?: { lat: number; lng: number; zoom?: number };
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lng]}
        icon={markerIcon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const pos = e.target.getLatLng();
            onChange(pos.lat, pos.lng);
          },
        }}
      />
      <ClickHandler onPick={onChange} />
      {flyTo && <FlyTo target={flyTo} />}
    </MapContainer>
  );
}
