import { Redis } from "@upstash/redis";
import type { Provider, StationStatus } from "./gbfs/types";

// Vercel Hobby runs the bundled cron daily. Keep the last successful snapshot
// long enough to distinguish stale data from missing data instead of turning
// every station into a false zero. Frequent external cron users can lower this.
const STATUS_TTL_SECONDS = positiveInt(
  process.env.STATUS_TTL_SECONDS,
  60 * 60 * 48,
);

let _redis: Redis | null = null;

function redis(): Redis {
  if (_redis) return _redis;
  // Vercel Marketplace の Upstash for Redis 統合は後方互換のため KV_* 変数を
  // 出力する。Upstash 直契約の場合は UPSTASH_* が来るので両方に対応する。
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Upstash Redis env vars not set (KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN)",
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}

function statusKey(provider: Provider) {
  return `station_status:${provider}`;
}

export type StatusSnapshot = {
  provider: Provider;
  fetchedAt: number;
  statuses: StationStatus[];
};

export async function writeStatusSnapshot(snapshot: StatusSnapshot) {
  await redis().set(statusKey(snapshot.provider), snapshot, {
    ex: STATUS_TTL_SECONDS,
  });
}

export async function readStatusSnapshot(
  provider: Provider,
): Promise<StatusSnapshot | null> {
  return (await redis().get<StatusSnapshot>(statusKey(provider))) ?? null;
}

export async function readAllStatusSnapshots(
  providers: Provider[],
): Promise<Map<Provider, StatusSnapshot>> {
  const entries = await Promise.all(
    providers.map(async (p) => [p, await readStatusSnapshot(p)] as const),
  );
  const map = new Map<Provider, StatusSnapshot>();
  for (const [p, snap] of entries) {
    if (snap) map.set(p, snap);
  }
  return map;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
