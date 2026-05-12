import type {
  GbfsStationInformation,
  GbfsStationStatus,
  Provider,
  Station,
  StationStatus,
} from "./types";

export function normalizeStations(
  provider: Provider,
  info: GbfsStationInformation,
): Station[] {
  return info.data.stations.map((s) => ({
    id: `${provider}:${s.station_id}`,
    provider,
    stationId: s.station_id,
    name: s.name,
    lat: s.lat,
    lon: s.lon,
    capacity: s.capacity ?? null,
  }));
}

export function normalizeStatuses(
  provider: Provider,
  status: GbfsStationStatus,
): StationStatus[] {
  return status.data.stations.map((s) => ({
    id: `${provider}:${s.station_id}`,
    numBikesAvailable: s.num_bikes_available ?? 0,
    numDocksAvailable:
      typeof s.num_docks_available === "number" ? s.num_docks_available : null,
    isRenting: toBool(s.is_renting, true),
    isReturning: toBool(s.is_returning, true),
    lastReported: s.last_reported ?? status.last_updated,
  }));
}

function toBool(v: number | boolean | undefined, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return fallback;
}
