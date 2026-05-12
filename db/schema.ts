import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const stations = pgTable(
  "stations",
  {
    id: text("id").primaryKey(), // "{provider}:{station_id}"
    provider: text("provider").notNull(),
    stationId: text("station_id").notNull(),
    name: text("name").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    capacity: integer("capacity"),
    prefectureCode: text("prefecture_code"), // JIS 都道府県コード (01-47)
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    providerIdx: index("stations_provider_idx").on(t.provider),
    prefectureIdx: index("stations_prefecture_idx").on(t.prefectureCode),
    latLonIdx: index("stations_lat_lon_idx").on(t.lat, t.lon),
  }),
);

export type StationRow = typeof stations.$inferSelect;
export type NewStationRow = typeof stations.$inferInsert;
