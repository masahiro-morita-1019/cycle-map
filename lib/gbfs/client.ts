import { z } from "zod";

const ODPT_BASE = "https://api.odpt.org/api/v4/gbfs";

function consumerKey(): string {
  const key = process.env.ODPT_CONSUMER_KEY;
  if (!key) {
    throw new Error("ODPT_CONSUMER_KEY is not set");
  }
  return key;
}

/**
 * Fetch a GBFS file from the ODPT proxy. ODPT injects auth via the
 * `acl:consumerKey` query parameter rather than a header.
 */
export async function fetchGbfs<T>(
  systemId: string,
  file: "gbfs" | "system_information" | "station_information" | "station_status",
  schema: z.ZodSchema<T>,
  options: { retries?: number; timeoutMs?: number } = {},
): Promise<T> {
  const { retries = 2, timeoutMs = 8000 } = options;
  const url = `${ODPT_BASE}/${systemId}/${file}.json?acl:consumerKey=${consumerKey()}`;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`GBFS ${systemId}/${file}: HTTP ${res.status}`);
      }
      const json = (await res.json()) as unknown;
      return schema.parse(json);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(200 * Math.pow(2, attempt));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`GBFS fetch failed: ${systemId}/${file}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
