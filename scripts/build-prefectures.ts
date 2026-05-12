/**
 * dataofjapan/land の japan.geojson をダウンロードし、
 *   - 各 Feature に `pref_code` (JIS 都道府県コード, "01"〜"47") を付与
 *   - mapshaper で形状を簡略化 (デフォルト 5%)
 * して `public/prefectures.json` に出力する。
 *
 *   pnpm build:prefectures
 *
 * 必要な依存: mapshaper (devDependency 済み)
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

const SOURCE =
  "https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson";
const TMP = "/tmp/cycle-map-japan.geojson";
const OUT = join(process.cwd(), "public/prefectures.json");
const SIMPLIFY = process.env.SIMPLIFY ?? "5%";

async function main() {
  console.log(`Downloading ${SOURCE}...`);
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(TMP, buf);
  console.log(`  → ${(buf.length / 1024 / 1024).toFixed(2)} MB`);

  mkdirSync(dirname(OUT), { recursive: true });

  console.log(`Simplifying (${SIMPLIFY}) and adding pref_code...`);
  // mapshaper CLI:
  //   -each: 各 Feature の properties に pref_code を追加 (1〜47 を "01"〜"47" にゼロ埋め)
  //   -simplify keep-shapes: 形状を簡略化しつつ消失を防ぐ
  //   -o format=geojson: GeoJSON で出力
  execSync(
    [
      `npx --yes mapshaper "${TMP}"`,
      `-each "pref_code = ('0' + id).slice(-2)"`,
      `-simplify ${SIMPLIFY} keep-shapes`,
      `-o "${OUT}" format=geojson`,
    ].join(" "),
    { stdio: "inherit" },
  );

  const size = statSync(OUT).size;
  console.log(`Output: ${OUT} (${(size / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
