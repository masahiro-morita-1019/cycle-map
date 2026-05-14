import type maplibregl from "maplibre-gl";
import type { CoverageRow } from "../api/coverage/route";

/** コロプレスを描画する最大ズーム。これ以上ズームインすると個別マーカー表示。 */
export const COVERAGE_MAX_ZOOM = 8;

/** 凡例 (CoverageLegend) と paint expression で同じ値を使うための共通定数。 */
export const COVERAGE_COLORS = {
  both: "#22c55e", // 両サービスあり (緑)
  hello: "#86efac", // HELLO CYCLING のみ (薄緑)
  docomo: "#fbbf24", // ドコモのみ (黄)
  none: "#374151", // 提供なし (濃灰)
} as const;

export type CoverageStatus = keyof typeof COVERAGE_COLORS;

/**
 * 都道府県カバレッジ (コロプレス) レイヤーをマップに追加する。
 *
 * MVP: zoom < 8 のときだけ表示。
 *  - 両サービスあり → 濃い色
 *  - HELLO CYCLING のみ → 薄い色
 *  - ドコモのみ → 別の薄い色
 *  - 0件 → グレー
 *
 * GeoJSON は `/prefectures.json` を fetch する。ファイルが配置されていない場合
 * (404) はレイヤーを追加せず静かにスキップする。
 */
export async function attachCoverageLayer(map: maplibregl.Map) {
  const [geo, coverage] = await Promise.all([
    fetch("/prefectures.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch("/api/coverage")
      .then((r) => (r.ok ? r.json() : { coverage: [] }))
      .then((d) => d.coverage as CoverageRow[])
      .catch(() => [] as CoverageRow[]),
  ]);

  if (!geo) return; // prefectures.json 未配置: 無視

  const codeToStatus = new Map<string, "both" | "hello" | "docomo" | "none">();
  for (const c of coverage) {
    if (!c.prefectureCode) continue;
    const both = c.hellocycling > 0 && c.docomo > 0;
    const hello = c.hellocycling > 0;
    const docomo = c.docomo > 0;
    codeToStatus.set(
      c.prefectureCode,
      both ? "both" : hello ? "hello" : docomo ? "docomo" : "none",
    );
  }

  // Annotate the GeoJSON features with a `status` property derived from the
  // coverage rows. We assume features have a `pref_code` (JIS 01-47) property.
  type Feat = GeoJSON.Feature<GeoJSON.Geometry, { pref_code?: string }>;
  const annotated: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: (geo.features as Feat[]).map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        status:
          codeToStatus.get(f.properties?.pref_code ?? "") ?? "none",
      },
    })),
  };

  if (!map.getSource("prefectures")) {
    map.addSource("prefectures", { type: "geojson", data: annotated });
  }
  if (!map.getLayer("prefectures-fill")) {
    map.addLayer(
      {
        id: "prefectures-fill",
        type: "fill",
        source: "prefectures",
        maxzoom: COVERAGE_MAX_ZOOM,
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "both", COVERAGE_COLORS.both,
            "hello", COVERAGE_COLORS.hello,
            "docomo", COVERAGE_COLORS.docomo,
            COVERAGE_COLORS.none,
          ],
          "fill-opacity": 0.45,
        },
      },
      "stations-point",
    );
  }
  if (!map.getLayer("prefectures-line")) {
    map.addLayer(
      {
        id: "prefectures-line",
        type: "line",
        source: "prefectures",
        maxzoom: COVERAGE_MAX_ZOOM,
        paint: { "line-color": "#0b0d10", "line-width": 0.5 },
      },
      "stations-point",
    );
  }
}
