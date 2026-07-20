import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export type CronAuthorization =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

export function authorizeCron(req: NextRequest): CronAuthorization {
  return verifyCronAuthorization(
    req.headers.get("authorization"),
    process.env.CRON_SECRET,
    process.env.NODE_ENV,
  );
}

export function verifyCronAuthorization(
  authorization: string | null,
  secret: string | undefined,
  environment: string | undefined,
): CronAuthorization {
  if (!secret) {
    if (environment === "production") {
      return { ok: false, status: 503, error: "cron is not configured" };
    }
    return { ok: true };
  }

  const expected = `Bearer ${secret}`;
  if (!safeEqual(authorization ?? "", expected)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  return { ok: true };
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return (
    actualBytes.length === expectedBytes.length &&
    timingSafeEqual(actualBytes, expectedBytes)
  );
}
