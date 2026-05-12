import { NextResponse, type NextRequest } from "next/server";
import { PROVIDERS, fetchStatus } from "@/lib/providers";
import { normalizeStatuses } from "@/lib/gbfs/normalize";
import { writeStatusSnapshot } from "@/lib/kv";
import type { Provider } from "@/lib/gbfs/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await Promise.allSettled(
    PROVIDERS.map((provider) => pollProvider(provider)),
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

async function pollProvider(provider: Provider) {
  const raw = await fetchStatus(provider);
  const statuses = normalizeStatuses(provider, raw);
  await writeStatusSnapshot({
    provider,
    fetchedAt: Math.floor(Date.now() / 1000),
    statuses,
  });
  return { count: statuses.length };
}

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Local dev: allow.
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
