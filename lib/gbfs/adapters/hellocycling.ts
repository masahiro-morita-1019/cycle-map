import { fetchGbfs } from "../client";
import {
  GbfsStationInformationSchema,
  GbfsStationStatusSchema,
} from "../types";

// ODPT 上の HELLO CYCLING (OpenStreet) 用 system_id。
// 環境変数で上書き可能にしておく (ODPT 側の命名が変わった場合に備えて)。
const SYSTEM_ID = process.env.ODPT_HELLOCYCLING_SYSTEM_ID ?? "hellocycling";

export async function fetchHelloCyclingInformation() {
  return fetchGbfs(SYSTEM_ID, "station_information", GbfsStationInformationSchema);
}

export async function fetchHelloCyclingStatus() {
  return fetchGbfs(SYSTEM_ID, "station_status", GbfsStationStatusSchema);
}
