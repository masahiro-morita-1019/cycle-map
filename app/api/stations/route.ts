import { NextResponse, type NextRequest } from "next/server";
import { and, gte, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { parseBbox } from "@/lib/geo";
import { readAllStatusSnapshots } from "@/lib/kv";
import {
  ProviderSchema,
  type Provider,
  type StationStatus,
  type StationWithStatus,
} from "@/lib/gbfs/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 2000;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bbox = parseBbox(url.searchParams.get("bbox"));
  const providers = parseProviders(url.searchParams.get("services"));

  if (!bbox) {
    return NextResponse.json(
      { error: "bbox query is required (west,south,east,north)" },
      { status: 400 },
    );
  }
  if (providers.length === 0) {
    return NextResponse.json({ stations: [], count: 0 });
  }

  const rows = await db
    .select()
    .from(schema.stations)
    .where(
      and(
        inArray(schema.stations.provider, providers),
        gte(schema.stations.lat, bbox.south),
        lte(schema.stations.lat, bbox.north),
        gte(schema.stations.lon, bbox.west),
        lte(schema.stations.lon, bbox.east),
      ),
    )
    .limit(MAX_RESULTS);

  const snapshots = await readAllStatusSnapshots(providers);
  const statusById = new Map<string, StationStatus>();
  for (const snap of snapshots.values()) {
    for (const s of snap.statuses) statusById.set(s.id, s);
  }

  const stations: StationWithStatus[] = rows.map((r) => ({
    id: r.id,
    provider: r.provider as Provider,
    stationId: r.stationId,
    name: r.name,
    lat: r.lat,
    lon: r.lon,
    capacity: r.capacity,
    staticUpdatedAt: r.updatedAt.toISOString(),
    status: statusById.get(r.id) ?? null,
  }));

  return NextResponse.json(
    { stations, count: stations.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}

function parseProviders(input: string | null): Provider[] {
  if (!input) return ["hellocycling", "docomo"];
  const out: Provider[] = [];
  for (const part of input.split(",").map((p) => p.trim())) {
    const parsed = ProviderSchema.safeParse(part);
    if (parsed.success && !out.includes(parsed.data)) out.push(parsed.data);
  }
  return out;
}
