"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ServiceFilter } from "./ServiceFilter";
import { renderStationPopupHtml } from "./StationPopup";
import { attachCoverageLayer } from "./CoverageLayer";
import { PROVIDER_LABEL, type Provider, type StationWithStatus } from "@/lib/gbfs/types";
import { useUrlState } from "../hooks/useUrlState";
import { useStations } from "../hooks/useStations";

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
  const stationsRef = useRef<StationWithStatus[]>([]);

  const { state, setState } = useUrlState({
    lat: DEFAULT_CENTER[1],
    lng: DEFAULT_CENTER[0],
    zoom: DEFAULT_ZOOM,
    services: ["hellocycling", "docomo"],
  });
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);

  const stations = useStations(bbox, state.services);
  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

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
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "stations",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#1e88e5",
          "circle-opacity": 0.75,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            14, 10, 18, 50, 24, 200, 30,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0b0d10",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "stations",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
          "text-font": ["Open Sans Regular"],
        },
        paint: { "text-color": "#fff" },
      });
      map.addLayer({
        id: "stations-point",
        type: "circle",
        source: "stations",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "case",
            ["==", ["get", "bikes"], 0], "#ef4444",
            ["<", ["get", "bikes"], 3], "#f59e0b",
            "#22c55e",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0b0d10",
        },
      });

      map.on("click", "stations-point", (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const id = String(f.properties?.id ?? "");
        const station = stationsRef.current.find((s) => s.id === id);
        if (!station) return;

        popupRef.current?.remove();
        const popup = new maplibregl.Popup({
          offset: 12,
          maxWidth: "320px",
          closeButton: true,
          closeOnClick: true,
        })
          .setLngLat([station.lon, station.lat])
          .setHTML(renderStationPopupHtml(station))
          .addTo(map);
        popupRef.current = popup;
      });
      map.on("click", "clusters", (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const coords = f.geometry.coordinates as [number, number];
        const src = map.getSource("stations") as GeoJSONSource;
        const clusterId = f.properties?.cluster_id as number | undefined;
        if (clusterId == null) return;
        src.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({ center: coords, zoom });
        });
      });
      const setCursor = (cursor: string) => (map.getCanvas().style.cursor = cursor);
      map.on("mouseenter", "stations-point", () => setCursor("pointer"));
      map.on("mouseleave", "stations-point", () => setCursor(""));
      map.on("mouseenter", "clusters", () => setCursor("pointer"));
      map.on("mouseleave", "clusters", () => setCursor(""));

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
  stations: StationWithStatus[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: {
        id: s.id,
        provider: s.provider,
        bikes: s.status?.numBikesAvailable ?? 0,
      },
    })),
  };
}
