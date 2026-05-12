import { fetchGbfs } from "../client";
import {
  GbfsStationInformationSchema,
  GbfsStationStatusSchema,
} from "../types";

// ODPT 上のドコモ・バイクシェア (東京) 用 system_id。
const SYSTEM_ID = process.env.ODPT_DOCOMO_SYSTEM_ID ?? "docomo-cycle-tokyo";

export async function fetchDocomoInformation() {
  return fetchGbfs(SYSTEM_ID, "station_information", GbfsStationInformationSchema);
}

export async function fetchDocomoStatus() {
  return fetchGbfs(SYSTEM_ID, "station_status", GbfsStationStatusSchema);
}
