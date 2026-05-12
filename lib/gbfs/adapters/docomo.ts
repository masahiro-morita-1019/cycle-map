import { fetchGbfs } from "../client";
import {
  GbfsStationInformationSchema,
  GbfsStationStatusSchema,
} from "../types";

// ODPT 上のドコモ・バイクシェア全国版用 system_id。
// 東京・横浜・川崎・仙台・広島など、ドコモが運営する全エリアを含む (約3000ポート)。
// 東京限定の `docomo-cycle-tokyo` も提供されているが、本アプリは全国版を使う。
const SYSTEM_ID = process.env.ODPT_DOCOMO_SYSTEM_ID ?? "docomo-cycle";

export async function fetchDocomoInformation() {
  return fetchGbfs(SYSTEM_ID, "station_information", GbfsStationInformationSchema);
}

export async function fetchDocomoStatus() {
  return fetchGbfs(SYSTEM_ID, "station_status", GbfsStationStatusSchema);
}
