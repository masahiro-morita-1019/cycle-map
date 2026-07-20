import { sql } from "drizzle-orm";
import { db, schema } from "./db";
import { prefectureCodeAt } from "./geo";
import { normalizeStations, normalizeStatuses } from "./gbfs/normalize";
import type { Provider } from "./gbfs/types";
import { writeStatusSnapshot } from "./kv";
import { fetchInformation, fetchStatus } from "./providers";

export async function pollProvider(provider: Provider) {
  const raw = await fetchStatus(provider);
  const statuses = normalizeStatuses(provider, raw);
  await writeStatusSnapshot({
    provider,
    fetchedAt: Math.floor(Date.now() / 1000),
    statuses,
  });
  return { count: statuses.length };
}

export async function refreshProvider(provider: Provider) {
  const raw = await fetchInformation(provider);
  const stations = normalizeStations(provider, raw);
  if (stations.length === 0) return { count: 0 };

  const rows = stations.map((station) => ({
    id: station.id,
    provider: station.provider,
    stationId: station.stationId,
    name: station.name,
    lat: station.lat,
    lon: station.lon,
    capacity: station.capacity,
    prefectureCode: prefectureCodeAt(station.lat, station.lon),
  }));

  // Neon HTTP driver has a payload size limit, so upsert in batches.
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    await db
      .insert(schema.stations)
      .values(rows.slice(i, i + batchSize))
      .onConflictDoUpdate({
        target: schema.stations.id,
        set: {
          name: sql`excluded.name`,
          lat: sql`excluded.lat`,
          lon: sql`excluded.lon`,
          capacity: sql`excluded.capacity`,
          prefectureCode: sql`excluded.prefecture_code`,
          updatedAt: sql`now()`,
        },
      });
  }

  return { count: stations.length };
}
