import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type CoverageRow = {
  prefectureCode: string | null;
  hellocycling: number;
  docomo: number;
};

export async function GET() {
  const rows = await db
    .select({
      prefectureCode: schema.stations.prefectureCode,
      provider: schema.stations.provider,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.stations)
    .groupBy(schema.stations.prefectureCode, schema.stations.provider);

  const byPref = new Map<string, CoverageRow>();
  for (const r of rows) {
    const key = r.prefectureCode ?? "unknown";
    const cur = byPref.get(key) ?? {
      prefectureCode: r.prefectureCode,
      hellocycling: 0,
      docomo: 0,
    };
    if (r.provider === "hellocycling") cur.hellocycling = r.count;
    if (r.provider === "docomo") cur.docomo = r.count;
    byPref.set(key, cur);
  }

  return NextResponse.json(
    { coverage: Array.from(byPref.values()) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
