import { NextResponse, type NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { PROVIDERS, fetchInformation } from "@/lib/providers";
import { normalizeStations } from "@/lib/gbfs/normalize";
import { db, schema } from "@/lib/db";
import { prefectureCodeAt } from "@/lib/geo";
import type { Provider } from "@/lib/gbfs/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await Promise.allSettled(
    PROVIDERS.map((provider) => refreshProvider(provider)),
  );

  const summary = results.map((r, i) => ({
    provider: PROVIDERS[i],
    ok: r.status === "fulfilled",
    count: r.status === "fulfilled" ? r.value.count : 0,
    error: r.status === "rejected" ? String(r.reason) : null,
  }));

  const allOk = summary.every((s) => s.ok);
  return NextResponse.json(
    { ok: allOk, providers: summary },
    { status: allOk ? 200 : 207 },
  );
}

async function refreshProvider(provider: Provider) {
  const raw = await fetchInformation(provider);
  const stations = normalizeStations(provider, raw);

  if (stations.length === 0) return { count: 0 };

  const rows = stations.map((s) => ({
    id: s.id,
    provider: s.provider,
    stationId: s.stationId,
    name: s.name,
    lat: s.lat,
    lon: s.lon,
    capacity: s.capacity,
    prefectureCode: prefectureCodeAt(s.lat, s.lon),
  }));

  // Neon HTTP driver has a payload size limit, so upsert in batches.
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db
      .insert(schema.stations)
      .values(rows.slice(i, i + BATCH))
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

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
