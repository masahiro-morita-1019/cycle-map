export type Bbox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function parseBbox(input: string | null): Bbox | null {
  if (!input) return null;
  const parts = input.split(",").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }
  const [west, south, east, north] = parts;
  if (west >= east || south >= north) return null;
  return { west, south, east, north };
}

export function inBbox(lat: number, lon: number, bbox: Bbox): boolean {
  return (
    lon >= bbox.west &&
    lon <= bbox.east &&
    lat >= bbox.south &&
    lat <= bbox.north
  );
}

/**
 * 都道府県判定。MVP では緯度経度の矩形近似で代用する (国土数値情報の境界
 * GeoJSON を読み込むのは API ルート起動コストが高いため、初期は近似で十分)。
 * フェーズ2でちゃんとした point-in-polygon に置き換える。
 */
export function approxPrefectureCode(lat: number, lon: number): string | null {
  // ざっくり: 東京周辺判定だけまず確実に。それ以外は null。
  // HELLO CYCLING は全国だが、MVP の集計用途では「東京/それ以外」が分かれば十分。
  if (lat >= 35.5 && lat <= 35.9 && lon >= 139.3 && lon <= 139.95) {
    return "13"; // 東京都
  }
  return null;
}
