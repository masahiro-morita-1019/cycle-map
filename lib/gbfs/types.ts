import { z } from "zod";

export const ProviderSchema = z.enum(["hellocycling", "docomo"]);
export type Provider = z.infer<typeof ProviderSchema>;

export const PROVIDER_LABEL: Record<Provider, string> = {
  hellocycling: "HELLO CYCLING",
  docomo: "ドコモ・バイクシェア",
};

/** 各サービスのブランドカラー (地図マーカー / 凡例で共通使用)。 */
export const PROVIDER_COLOR: Record<Provider, string> = {
  hellocycling: "#eab308", // HELLO CYCLING のゴールデンイエロー (yellow-500)
  docomo: "#dc2626", // ドコモレッド (red-600)
};

// GBFS spec subsets we depend on
export const GbfsStationInformationSchema = z.object({
  data: z.object({
    stations: z.array(
      z.object({
        station_id: z.string(),
        name: z.string(),
        lat: z.number(),
        lon: z.number(),
        capacity: z.number().int().optional(),
        address: z.string().optional(),
        post_code: z.string().optional(),
      }),
    ),
  }),
  last_updated: z.number().int(),
  ttl: z.number().int().optional(),
});
export type GbfsStationInformation = z.infer<
  typeof GbfsStationInformationSchema
>;

export const GbfsStationStatusSchema = z.object({
  data: z.object({
    stations: z.array(
      z.object({
        station_id: z.string(),
        num_bikes_available: z.number().int().optional(),
        num_docks_available: z.number().int().optional(),
        is_installed: z.union([z.number(), z.boolean()]).optional(),
        is_renting: z.union([z.number(), z.boolean()]).optional(),
        is_returning: z.union([z.number(), z.boolean()]).optional(),
        last_reported: z.number().int().optional(),
      }),
    ),
  }),
  last_updated: z.number().int(),
  ttl: z.number().int().optional(),
});
export type GbfsStationStatus = z.infer<typeof GbfsStationStatusSchema>;

/** Unified internal station shape used across the app. */
export type Station = {
  id: string; // "{provider}:{station_id}"
  provider: Provider;
  stationId: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number | null;
};

/** Unified internal status shape. */
export type StationStatus = {
  id: string; // "{provider}:{station_id}"
  numBikesAvailable: number;
  numDocksAvailable: number | null;
  isRenting: boolean;
  isReturning: boolean;
  lastReported: number;
};

export type StationWithStatus = Station & {
  /** 静的情報 (位置・名称・容量) を最後に同期した日時 (ISO 8601)。 */
  staticUpdatedAt: string;
  status: StationStatus | null;
};

/**
 * 地図への描画だけに必要な最小フィールド。
 * 一覧 API (/api/stations) のレスポンス。
 * 詳細 (name / capacity / docks / lastReported) はクリック時に
 * /api/stations/[id] で別途取得する。
 */
export type StationLite = {
  id: string;
  provider: Provider;
  lat: number;
  lon: number;
  /** num_bikes_available。status 未取得時は null。 */
  bikes: number | null;
  /** スナップショット取得時刻を基準にした鮮度。 */
  statusFreshness: "fresh" | "stale" | "unknown";
  statusUpdatedAt: number | null;
  isRenting: boolean | null;
};
