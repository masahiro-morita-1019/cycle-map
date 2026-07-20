"use client";

import { useEffect, useState } from "react";
import type { Provider, StationLite } from "@/lib/gbfs/types";

const FETCH_DEBOUNCE_MS = 250;
const CACHE_TTL_MS = 3 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const BBOX_ROUNDING_FACTOR = 100; // 0.01 degrees, rounded outward
const PROVIDER_ORDER: Provider[] = ["hellocycling", "docomo"];

type StationCacheEntry = {
  expiresAt: number;
  response: StationsResponse;
};

type StationsResponse = {
  stations: StationLite[];
  truncated: boolean;
};

export type StationsState = StationsResponse & {
  isLoading: boolean;
  error: string | null;
};

const stationCache = new Map<string, StationCacheEntry>();

export function useStations(
  bbox: [number, number, number, number] | null,
  services: Provider[],
): StationsState {
  const [result, setResult] = useState<StationsState>({
    stations: [],
    truncated: false,
    isLoading: false,
    error: null,
  });
  const roundedBbox = bbox ? roundBboxOut(bbox) : null;
  const bboxKey = roundedBbox ? roundedBbox.map((n) => n.toFixed(2)).join(",") : "";
  const normalizedServices = normalizeServices(services);
  const servicesKey = normalizedServices.join(",");
  const cacheKey = roundedBbox ? `${servicesKey}|${bboxKey}` : "";

  useEffect(() => {
    if (!roundedBbox || normalizedServices.length === 0) {
      setResult({ stations: [], truncated: false, isLoading: false, error: null });
      return;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      setResult({ ...cached, isLoading: false, error: null });
      return;
    }

    setResult({ stations: [], truncated: false, isLoading: true, error: null });

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({
          bbox: roundedBbox.join(","),
          services: normalizedServices.join(","),
        });
        const res = await fetch(`/api/stations?${sp.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as StationsResponse;
        setCache(cacheKey, data);
        setResult({ ...data, isLoading: false, error: null });
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          console.error("useStations:", err);
          setResult({
            stations: [],
            truncated: false,
            isLoading: false,
            error: "ポート情報を取得できませんでした。",
          });
        }
      }
    }, FETCH_DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, servicesKey]);

  return result;
}

function normalizeServices(services: Provider[]) {
  return [...services].sort(
    (a, b) => PROVIDER_ORDER.indexOf(a) - PROVIDER_ORDER.indexOf(b),
  );
}

function roundBboxOut(
  bbox: [number, number, number, number],
): [number, number, number, number] {
  const [west, south, east, north] = bbox;
  return [
    Math.floor(west * BBOX_ROUNDING_FACTOR) / BBOX_ROUNDING_FACTOR,
    Math.floor(south * BBOX_ROUNDING_FACTOR) / BBOX_ROUNDING_FACTOR,
    Math.ceil(east * BBOX_ROUNDING_FACTOR) / BBOX_ROUNDING_FACTOR,
    Math.ceil(north * BBOX_ROUNDING_FACTOR) / BBOX_ROUNDING_FACTOR,
  ];
}

function getCache(key: string): StationsResponse | null {
  const cached = stationCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    stationCache.delete(key);
    return null;
  }
  stationCache.delete(key);
  stationCache.set(key, cached);
  return cached.response;
}

function setCache(key: string, response: StationsResponse) {
  stationCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    response,
  });
  while (stationCache.size > MAX_CACHE_ENTRIES) {
    const oldest = stationCache.keys().next().value;
    if (!oldest) break;
    stationCache.delete(oldest);
  }
}
