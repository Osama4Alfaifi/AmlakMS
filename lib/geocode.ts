import { SAUDI_REGIONS } from "@/lib/saudi-regions";

export interface GeocodedAddress {
  region?: string;
  city?: string;
  district?: string;
  street?: string;
  postalCode?: string;
  buildingNumber?: string;
}

// Reverse geocoding through OpenStreetMap's public Nominatim service: no API
// key, but coverage of Saudi National Address data (building number, additional
// number) is partial, so those fields are filled when OSM has them and are
// otherwise typed by hand. Best-effort: resolves to null on any failure.
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedAddress | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=ar&zoom=18&lat=${lat}&lon=${lng}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const a = (await res.json()).address as Record<string, string> | undefined;
    if (!a) return null;
    const state = a.state ?? a.region ?? "";
    const region = SAUDI_REGIONS.find((r) => state.includes(r.name.replace("منطقة ", "")))?.name;
    return {
      region,
      city: (a.city ?? a.town ?? a.village ?? a.county)?.replace(/^محافظة\s+/, ""),
      district: a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district,
      street: a.road,
      postalCode: a.postcode,
      buildingNumber: a.house_number,
    };
  } catch {
    return null;
  }
}
