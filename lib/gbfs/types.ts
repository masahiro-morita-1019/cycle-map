import { z } from "zod";

export const ProviderSchema = z.enum(["hellocycling", "docomo"]);
export type Provider = z.infer<typeof ProviderSchema>;

export const PROVIDER_LABEL: Record<Provider, string> = {
  hellocycling: "HELLO CYCLING",
  docomo: "ドコモ・バイクシェア",
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
