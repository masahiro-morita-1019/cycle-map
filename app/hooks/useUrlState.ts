"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProviderSchema, type Provider } from "@/lib/gbfs/types";

export type UrlState = {
  lat: number;
  lng: number;
  zoom: number;
  services: Provider[];
};

const URL_SYNC_DEBOUNCE_MS = 300;

export function useUrlState(defaults: UrlState) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial parse from URL (one-shot)
  const initial = useRef<UrlState | null>(null);
  if (!initial.current) {
    initial.current = parseSearchParams(searchParams, defaults);
  }
  const [state, setStateInternal] = useState<UrlState>(initial.current);

  const setState = useCallback((patch: Partial<UrlState>) => {
    setStateInternal((prev) => ({ ...prev, ...patch }));
  }, []);

  // Debounced URL push
  useEffect(() => {
    const timer = setTimeout(() => {
      const sp = new URLSearchParams();
      sp.set("lat", state.lat.toFixed(5));
      sp.set("lng", state.lng.toFixed(5));
      sp.set("zoom", state.zoom.toFixed(2));
      sp.set("services", state.services.join(","));
      router.replace(`/?${sp.toString()}`, { scroll: false });
    }, URL_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state, router]);

  return { state, setState };
}

function parseSearchParams(
  sp: URLSearchParams | ReturnType<typeof useSearchParams>,
  defaults: UrlState,
): UrlState {
  const lat = num(sp.get("lat"), defaults.lat);
  const lng = num(sp.get("lng"), defaults.lng);
  const zoom = num(sp.get("zoom"), defaults.zoom);
  const services = parseServices(sp.get("services"), defaults.services);
  return { lat, lng, zoom, services };
}

function num(v: string | null, fallback: number): number {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseServices(v: string | null, fallback: Provider[]): Provider[] {
  if (!v) return fallback;
  const out: Provider[] = [];
  for (const p of v.split(",")) {
    const parsed = ProviderSchema.safeParse(p.trim());
    if (parsed.success && !out.includes(parsed.data)) out.push(parsed.data);
  }
  return out.length > 0 ? out : fallback;
}
