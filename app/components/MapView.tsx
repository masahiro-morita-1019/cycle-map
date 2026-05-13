"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ServiceFilter } from "./ServiceFilter";
import {
  renderStationPopupHtml,
  renderStationPopupLoadingHtml,
} from "./StationPopup";
import { attachCoverageLayer } from "./CoverageLayer";
import {
  PROVIDER_LABEL,
  type Provider,
  type StationLite,
  type StationWithStatus,
} from "@/lib/gbfs/types";
import { useUrlState } from "../hooks/useUrlState";
import { useStations } from "../hooks/useStations";

// TODO: クラスタリング再有効化は別 commit で対応。
// Next.js dev で MapLibre worker URL 解決が壊れて actor 起動に失敗するため、
// public/ に worker JS をコピーする postinstall スクリプトを足す必要がある。

const STYLE_URL = (() => {
  const key = process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY;
  if (key) return `https://api.protomaps.com/styles/v5/dark/en?key=${key}`;
  return null;
})();

const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const DEFAULT_CENTER: [number, number] = [139.7671, 35.6812]; // 東京駅
const DEFAULT_ZOOM = 12;

export function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupAbortRef = useRef<AbortController | null>(null);

  const { state, setState } = useUrlState({
    lat: DEFAULT_CENTER[1],
    lng: DEFAULT_CENTER[0],
    zoom: DEFAULT_ZOOM,
    services: ["hellocycling", "docomo"],
  });
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);

  const stations = useStations(bbox, state.services);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL ?? FALLBACK_STYLE,
      center: [state.lng, state.lat],
      zoom: state.zoom,
      attributionControl: { compact: true },
    });
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      "top-right",
    );

    map.on("load", () => {
      map.addSource("stations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: false,
      });

      map.addLayer({
        id: "stations-point",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": 7,
          // 塗り = プロバイダ識別
          "circle-color": [
            "match",
            ["get", "provider"],
            "hellocycling", "#3b82f6", // 青
            "docomo", "#ef4444",        // 赤
            "#9ca3af",                  // fallback
          ],
          // ストローク = 空き状況 (太めで識別しやすく)
          "circle-stroke-width": 3,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "bikes"], 0], "#374151", // 空き0 = 濃灰
            ["<", ["get", "bikes"], 3], "#fbbf24",  // 少ない = 黄
            "#22c55e",                                // 十分 = 緑
          ],
        },
      });

      map.on("click", "stations-point", (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const id = String(f.properties?.id ?? "");
        const coords = f.geometry.coordinates as [number, number];
        if (!id) return;

        // 既存のポップアップと進行中の fetch を破棄
        popupRef.current?.remove();
        popupAbortRef.current?.abort();

        const popup = new maplibregl.Popup({
          offset: 12,
          maxWidth: "320px",
          closeButton: true,
          closeOnClick: true,
        })
          .setLngLat(coords)
          .setHTML(renderStationPopupLoadingHtml())
          .addTo(map);
        popupRef.current = popup;

        const controller = new AbortController();
        popupAbortRef.current = controller;

        fetch(`/api/stations/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
          .then((detail: StationWithStatus) => {
            // ポップアップが閉じられていたら何もしない
            if (popupRef.current !== popup) return;
            popup.setHTML(renderStationPopupHtml(detail));
          })
          .catch((err) => {
            if ((err as { name?: string }).name === "AbortError") return;
            if (popupRef.current !== popup) return;
            popup.setHTML(
              `<div class="cm-popup"><div class="cm-popup__name">読み込みに失敗しました</div></div>`,
            );
          });
      });
      const setCursor = (cursor: string) =>
        (map.getCanvas().style.cursor = cursor);
      map.on("mouseenter", "stations-point", () => setCursor("pointer"));
      map.on("mouseleave", "stations-point", () => setCursor(""));

      updateBboxFromMap();
      attachCoverageLayer(map).catch((err) =>
        console.error("coverage layer:", err),
      );
    });

    const updateBboxFromMap = () => {
      const b = map.getBounds();
      setBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      const c = map.getCenter();
      setState({ lat: c.lat, lng: c.lng, zoom: map.getZoom() });
    };
    map.on("moveend", updateBboxFromMap);

    mapRef.current = map;
    return () => {
      popupAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push station data into the map source
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource("stations") as GeoJSONSource | undefined;
      if (!src) return;
      src.setData(toFeatureCollection(stations));
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [stations]);

  const onToggleService = useCallback(
    (provider: Provider) => {
      const current = new Set(state.services);
      if (current.has(provider)) current.delete(provider);
      else current.add(provider);
      const next = Array.from(current) as Provider[];
      if (next.length === 0) return;
      setState({ services: next });
    },
    [state.services, setState],
  );

  return (
    <>
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="absolute left-3 top-3 z-10">
        <ServiceFilter
          services={state.services}
          labels={PROVIDER_LABEL}
          onToggle={onToggleService}
        />
      </div>
    </>
  );
}

function toFeatureCollection(
  stations: StationLite[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: {
        id: s.id,
        provider: s.provider,
        bikes: s.bikes,
      },
    })),
  };
}
