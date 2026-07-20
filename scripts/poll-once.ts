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
  const { PROVIDERS } = await import("../lib/providers");
  const { pollProvider, refreshProvider } = await import("../lib/sync");

  let failed = false;

  for (const provider of PROVIDERS) {
    process.stdout.write(`[${provider}] syncing... `);
    try {
      const stationResult = await refreshProvider(provider);
      const statusResult = await pollProvider(provider);
      console.log(
        `ok: ${stationResult.count} stations / ${statusResult.count} statuses`,
      );
    } catch (err) {
      failed = true;
      console.log("FAILED");
      console.error(err);
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
