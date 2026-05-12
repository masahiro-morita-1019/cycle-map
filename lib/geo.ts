import prefecturesGeo from "../public/prefectures.json";

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

/* ---------- prefecture point-in-polygon ---------- */

type Ring = [number, number][];
type Polygon = Ring[];
type MultiPolygon = Polygon[];
type PrefIndex = {
  code: string;
  bbox: [number, number, number, number]; // west, south, east, north
  geom: MultiPolygon | Polygon;
  type: "Polygon" | "MultiPolygon";
};

const PREF_INDEX: PrefIndex[] = buildIndex();

function buildIndex(): PrefIndex[] {
  // GeoJSON FeatureCollection from public/prefectures.json
  type Feat = {
    type: "Feature";
    properties: { pref_code?: string };
    geometry:
      | { type: "Polygon"; coordinates: Polygon }
      | { type: "MultiPolygon"; coordinates: MultiPolygon };
  };
  const fc = prefecturesGeo as unknown as { features: Feat[] };

  return fc.features
    .filter((f) => typeof f.properties?.pref_code === "string")
    .map((f) => {
      const bbox = computeBbox(f.geometry);
      return {
        code: f.properties.pref_code as string,
        bbox,
        geom: f.geometry.coordinates,
        type: f.geometry.type,
      };
    });
}

function computeBbox(
  g:
    | { type: "Polygon"; coordinates: Polygon }
    | { type: "MultiPolygon"; coordinates: MultiPolygon },
): [number, number, number, number] {
  let w = Infinity,
    s = Infinity,
    e = -Infinity,
    n = -Infinity;
  const visit = (ring: Ring) => {
    for (const [x, y] of ring) {
      if (x < w) w = x;
      if (x > e) e = x;
      if (y < s) s = y;
      if (y > n) n = y;
    }
  };
  if (g.type === "Polygon") {
    for (const ring of g.coordinates) visit(ring);
  } else {
    for (const poly of g.coordinates) for (const ring of poly) visit(ring);
  }
  return [w, s, e, n];
}

function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lon: number, lat: number, polygon: Polygon): boolean {
  if (polygon.length === 0) return false;
  if (!pointInRing(lon, lat, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(lon, lat, polygon[i])) return false; // hole
  }
  return true;
}

/**
 * 緯度経度から JIS 都道府県コード ("01"〜"47") を返す。該当なしは null。
 * 簡略化されたポリゴンを使うため、海岸線ぎりぎりのポートで誤判定の可能性あり。
 */
export function prefectureCodeAt(lat: number, lon: number): string | null {
  for (const p of PREF_INDEX) {
    const [w, s, e, n] = p.bbox;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    if (p.type === "Polygon") {
      if (pointInPolygon(lon, lat, p.geom as Polygon)) return p.code;
    } else {
      for (const poly of p.geom as MultiPolygon) {
        if (pointInPolygon(lon, lat, poly)) return p.code;
      }
    }
  }
  return null;
}
