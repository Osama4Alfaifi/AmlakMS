"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Property } from "@/lib/types";
import { currency } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:${color};border:2.5px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export function PropertyMap({ properties }: { properties: Property[] }) {
  const center: [number, number] = properties.length
    ? [properties[0].lat, properties[0].lng]
    : [24.7136, 46.6753];

  return (
    <MapContainer center={center} zoom={6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon(p.color)}>
          <Popup>
            <div style={{ fontFamily: "var(--font-cairo)", minWidth: 180 }} dir="rtl">
              <p style={{ fontWeight: 800, marginBottom: 4 }}>{p.title}</p>
              <p style={{ fontSize: 12, color: "#5b6870", marginBottom: 6 }}>
                {p.city} · {p.district}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                {currency(p.price)}
                {p.listingType === "إيجار" && <span style={{ fontWeight: 400 }}> / سنويًا</span>}
              </p>
              <Badge>{p.status}</Badge>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
