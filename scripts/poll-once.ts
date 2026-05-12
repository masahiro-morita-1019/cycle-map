/**
 * 単発のポーリング実行スクリプト。
 *   pnpm tsx scripts/poll-once.ts
 *
 * 必要な環境変数: ODPT_CONSUMER_KEY, KV_*, DATABASE_URL
 * .env.local を読み込んでから実行することを想定。
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { PROVIDERS, fetchInformation, fetchStatus } = await import(
    "../lib/providers"
  );
  const { normalizeStations, normalizeStatuses } = await import(
    "../lib/gbfs/normalize"
  );

  for (const provider of PROVIDERS) {
    process.stdout.write(`[${provider}] fetching... `);
    try {
      const info = await fetchInformation(provider);
      const status = await fetchStatus(provider);
      const stations = normalizeStations(provider, info);
      const statuses = normalizeStatuses(provider, status);
      console.log(
        `ok: ${stations.length} stations / ${statuses.length} statuses`,
      );
    } catch (err) {
      console.log("FAILED");
      console.error(err);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
