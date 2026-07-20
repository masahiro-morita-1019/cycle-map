import { NextResponse, type NextRequest } from "next/server";
import { and, gte, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { parseBbox, type Bbox } from "@/lib/geo";
import { readAllStatusSnapshots } from "@/lib/kv";
import {
  ProviderSchema,
  type Provider,
  type StationLite,
  type StationStatus,
} from "@/lib/gbfs/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RESULTS = 2000;
const CACHE_TTL_MS = 3 * 60 * 1000;
const MAX_RESPONSE_CACHE_ENTRIES = 100;
const CACHE_CONTROL = "public, s-maxage=180, stale-while-revalidate=300";
const PROVIDER_ORDER: Provider[] = ["hellocycling", "docomo"];
const STATUS_STALE_AFTER_SECONDS = positiveInt(
  process.env.STATUS_STALE_AFTER_SECONDS,
  15 * 60,
);

type StationsResponse = {
  stations: StationLite[];
  count: number;
  truncated: boolean;
};

type Timings = {
  db: number;
  status: number;
  merge: number;
  total: number;
  cache: "hit" | "miss";
};

type StatusCacheEntry = {
  expiresAt: number;
  statusById: Map<string, StatusWithSnapshot>;
};

type StatusReadResult = {
  statusById: Map<string, StatusWithSnapshot>;
  complete: boolean;
};

type StatusWithSnapshot = {
  status: StationStatus;
  fetchedAt: number;
};

type ResponseCacheEntry = {
  expiresAt: number;
  body: StationsResponse;
};

const statusCache = new Map<string, StatusCacheEntry>();
const responseCache = new Map<string, ResponseCacheEntry>();
const pendingStatusReads = new Map<string, Promise<StatusReadResult>>();

export async function GET(req: NextRequest) {
  const startedAt = performance.now();
  const url = new URL(req.url);
  const parsedBbox = parseBbox(url.searchParams.get("bbox"));
  const providers = parseProviders(url.searchParams.get("services"));

  if (!parsedBbox) {
    return NextResponse.json(
      { error: "bbox query is required (west,south,east,north)" },
      { status: 400 },
    );
  }
  if (providers.length === 0) {
    return jsonWithHeaders(
      { stations: [], count: 0, truncated: false },
      {
        db: 0,
        status: 0,
        merge: 0,
        total: performance.now() - startedAt,
        cache: "miss",
      },
    );
  }

  const cacheKey = responseCacheKey(parsedBbox, providers);
  const cached = getResponseCache(cacheKey);
  if (cached) {
    const timings: Timings = {
      db: 0,
      status: 0,
      merge: 0,
      total: performance.now() - startedAt,
      cache: "hit",
    };
    logTimings(cacheKey, timings, cached.body.count);
    return jsonWithHeaders(cached.body, timings);
  }

  const dbStartedAt = performance.now();
  const queriedRows = await db
    .select({
      id: schema.stations.id,
      provider: schema.stations.provider,
      lat: schema.stations.lat,
      lon: schema.stations.lon,
    })
    .from(schema.stations)
    .where(
      and(
        inArray(schema.stations.provider, providers),
        gte(schema.stations.lat, parsedBbox.south),
        lte(schema.stations.lat, parsedBbox.north),
        gte(schema.stations.lon, parsedBbox.west),
        lte(schema.stations.lon, parsedBbox.east),
      ),
    )
    .limit(MAX_RESULTS + 1);
  const truncated = queriedRows.length > MAX_RESULTS;
  const rows = queriedRows.slice(0, MAX_RESULTS);
  const dbMs = performance.now() - dbStartedAt;

  const statusStartedAt = performance.now();
  const statusById = await getStatusById(providers);
  const statusMs = performance.now() - statusStartedAt;

  const mergeStartedAt = performance.now();
  const now = Math.floor(Date.now() / 1000);
  const stations: StationLite[] = rows.map((r) => {
    const current = statusById.get(r.id);
    return {
      id: r.id,
      provider: r.provider as Provider,
      lat: r.lat,
      lon: r.lon,
      bikes: current?.status.numBikesAvailable ?? null,
      isRenting: current?.status.isRenting ?? null,
      statusUpdatedAt:
        current?.status.lastReported ?? current?.fetchedAt ?? null,
      statusFreshness: !current
        ? "unknown"
        : now - current.fetchedAt > STATUS_STALE_AFTER_SECONDS
          ? "stale"
          : "fresh",
    };
  });
  const mergeMs = performance.now() - mergeStartedAt;

  const body = { stations, count: stations.length, truncated };
  setResponseCache(cacheKey, body);

  const timings: Timings = {
    db: dbMs,
    status: statusMs,
    merge: mergeMs,
    total: performance.now() - startedAt,
    cache: "miss",
  };
  logTimings(cacheKey, timings, body.count);

  return jsonWithHeaders(body, timings);
}

function parseProviders(input: string | null): Provider[] {
  const raw = input ? input.split(",").map((p) => p.trim()) : PROVIDER_ORDER;
  const out: Provider[] = [];
  for (const part of raw) {
    const parsed = ProviderSchema.safeParse(part);
    if (parsed.success && !out.includes(parsed.data)) out.push(parsed.data);
  }
  return out.sort(
    (a, b) => PROVIDER_ORDER.indexOf(a) - PROVIDER_ORDER.indexOf(b),
  );
}

function responseCacheKey(bbox: Bbox, providers: Provider[]) {
  return [
    providers.join(","),
    bbox.west.toFixed(5),
    bbox.south.toFixed(5),
    bbox.east.toFixed(5),
    bbox.north.toFixed(5),
  ].join("|");
}

async function getStatusById(
  providers: Provider[],
): Promise<Map<string, StatusWithSnapshot>> {
  const key = providers.join(",");
  const now = Date.now();
  const cached = statusCache.get(key);
  if (cached && cached.expiresAt > now) return cached.statusById;

  const pending = pendingStatusReads.get(key);
  if (pending) {
    const result = await pending;
    return result.statusById;
  }

  const promise = readStatusById(providers);
  pendingStatusReads.set(key, promise);
  try {
    const result = await promise;
    if (result.complete) {
      statusCache.set(key, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        statusById: result.statusById,
      });
    }
    return result.statusById;
  } finally {
    pendingStatusReads.delete(key);
  }
}

async function readStatusById(providers: Provider[]): Promise<StatusReadResult> {
  const snapshots = await readAllStatusSnapshots(providers);
  const statusById = new Map<string, StatusWithSnapshot>();
  for (const snap of snapshots.values()) {
    for (const status of snap.statuses) {
      statusById.set(status.id, { status, fetchedAt: snap.fetchedAt });
    }
  }
  return {
    statusById,
    complete: providers.every((p) => snapshots.has(p)),
  };
}

function getResponseCache(key: string): ResponseCacheEntry | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  responseCache.delete(key);
  responseCache.set(key, cached);
  return cached;
}

function setResponseCache(key: string, body: StationsResponse) {
  responseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, body });
  while (responseCache.size > MAX_RESPONSE_CACHE_ENTRIES) {
    const oldest = responseCache.keys().next().value;
    if (!oldest) break;
    responseCache.delete(oldest);
  }
}

function jsonWithHeaders(body: StationsResponse, timings: Timings) {
  return NextResponse.json(
    body,
    {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Server-Timing": serverTiming(timings),
      },
    },
  );
}

function serverTiming(t: Timings) {
  return [
    `db;dur=${roundMs(t.db)}`,
    `status;dur=${roundMs(t.status)}`,
    `merge;dur=${roundMs(t.merge)}`,
    `total;dur=${roundMs(t.total)}`,
    `cache;desc="${t.cache}"`,
  ].join(", ");
}

function logTimings(key: string, t: Timings, count: number) {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    `[api/stations] cache=${t.cache} count=${count} total=${roundMs(t.total)}ms db=${roundMs(t.db)}ms status=${roundMs(t.status)}ms merge=${roundMs(t.merge)}ms key=${key}`,
  );
}

function roundMs(ms: number) {
  return Math.round(ms * 10) / 10;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
