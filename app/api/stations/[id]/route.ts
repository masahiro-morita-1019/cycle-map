import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { readStatusSnapshot } from "@/lib/kv";
import {
  ProviderSchema,
  type Provider,
  type StationWithStatus,
} from "@/lib/gbfs/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, s-maxage=180, stale-while-revalidate=300";

/**
 * 個別ステーションの詳細情報を返す。
 * id は "{provider}:{station_id}" 形式。
 * ポップアップ表示時に MapView からクリックで叩かれる。
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const provider = providerOf(id);
  if (!provider) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(schema.stations)
    .where(eq(schema.stations.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const snap = await readStatusSnapshot(provider);
  const status = snap?.statuses.find((s) => s.id === id) ?? null;

  const station: StationWithStatus = {
    id: row.id,
    provider: row.provider as Provider,
    stationId: row.stationId,
    name: row.name,
    lat: row.lat,
    lon: row.lon,
    capacity: row.capacity,
    staticUpdatedAt: row.updatedAt.toISOString(),
    status,
  };

  return NextResponse.json(station, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}

function providerOf(id: string): Provider | null {
  const head = id.split(":")[0];
  const parsed = ProviderSchema.safeParse(head);
  return parsed.success ? parsed.data : null;
}
