"use client";

import { useEffect, useState } from "react";
import type { Provider, StationLite } from "@/lib/gbfs/types";

const FETCH_DEBOUNCE_MS = 400;

export function useStations(
  bbox: [number, number, number, number] | null,
  services: Provider[],
): StationLite[] {
  const [stations, setStations] = useState<StationLite[]>([]);
  const bboxKey = bbox ? bbox.map((n) => n.toFixed(4)).join(",") : "";
  const servicesKey = services.join(",");

  useEffect(() => {
    if (!bbox || services.length === 0) {
      setStations([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({
          bbox: bbox.join(","),
          services: services.join(","),
        });
        const res = await fetch(`/api/stations?${sp.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { stations: StationLite[] };
        setStations(data.stations);
      } catch (err) {
        if ((err as { name?: string }).name !== "AbortError") {
          console.error("useStations:", err);
        }
      }
    }, FETCH_DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bboxKey, servicesKey]);

  return stations;
}
