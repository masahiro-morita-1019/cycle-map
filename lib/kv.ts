import { kv } from "@vercel/kv";
import type { Provider, StationStatus } from "./gbfs/types";

const STATUS_TTL_SECONDS = 60 * 10; // 10 min — much longer than poll cadence so stale-while-revalidate works

function statusKey(provider: Provider) {
  return `station_status:${provider}`;
}

export type StatusSnapshot = {
  provider: Provider;
  fetchedAt: number;
  statuses: StationStatus[];
};

export async function writeStatusSnapshot(snapshot: StatusSnapshot) {
  await kv.set(statusKey(snapshot.provider), snapshot, {
    ex: STATUS_TTL_SECONDS,
  });
}

export async function readStatusSnapshot(
  provider: Provider,
): Promise<StatusSnapshot | null> {
  return (await kv.get<StatusSnapshot>(statusKey(provider))) ?? null;
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
