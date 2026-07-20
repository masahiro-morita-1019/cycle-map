import { NextResponse, type NextRequest } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { PROVIDERS } from "@/lib/providers";
import { refreshProvider } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = authorizeCron(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
    { status: allOk ? 200 : 503 },
  );
}
