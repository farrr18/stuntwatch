"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";
import type { Feature, Geometry } from "geojson";
import type { Province, MapDataDictionary } from "@/lib/types";
import type { MapFeatureCollection, GeoFeatureProperties } from "@/lib/geo";
import { getMapFillColor } from "@/lib/colorScale";
import { resolveProvinceSlug } from "@/lib/api/mockAdapter";

export type MapTierFilter =
  | "Rendah"
  | "Sedang"
  | "Tinggi"
  | "Sangat Tinggi"
  | null;

// Full Indonesian archipelago bounds (Aceh/Sabang to Papua/Merauke)
const INDONESIA_BOUNDS: L.LatLngBoundsExpression = [
  [-11.2, 94.5],
  [6.2, 141.2],
];

// Ocean lock bounds so users cannot pan into empty ocean
const MAX_OCEAN_BOUNDS: L.LatLngBoundsExpression = [
  [-15.5, 89.0],
  [10.5, 146.5],
];

interface LeafletNationalCanvasProps {
  provinces: Province[];
  mapData: MapDataDictionary;
  provincesGeo: MapFeatureCollection;
  allKabGeo: MapFeatureCollection | undefined;
  layerMode: "kabupaten" | "province";
  hoveredProvinceId: string | null;
  selectedIslandGroup: string;
  activeTierFilter?: MapTierFilter;
  flyToTarget?: {
    type: "province" | "district";
    id: string;
    timestamp: number;
  } | null;
  onHoverProvince: (slug: string | null) => void;
  onSelectProvince: (slug: string) => void;
  onSelectDistrict: (provinceSlug: string, domainId: string) => void;
}

interface HoveredTooltipState {
  title: string;
  badgeText: string;
  badgeColor: string;
  subtitle: string;
  footerLeft: string;
  footerRight: string;
  x: number;
  y: number;
}

function getProvinceTierName(score: number): string {
  if (score >= 30) return "Sangat Tinggi";
  if (score >= 20) return "Tinggi";
  if (score >= 10) return "Sedang";
  return "Rendah";
}

function MapResizeAndBoundsController({
  wrapperRef,
  provincesGeo,
  allKabGeo,
  selectedIslandGroup,
  flyToTarget,
}: {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  provincesGeo: MapFeatureCollection;
  allKabGeo: MapFeatureCollection | undefined;
  selectedIslandGroup: string;
  flyToTarget?: {
    type: "province" | "district";
    id: string;
    timestamp: number;
  } | null;
}) {
  const map = useMap();
  const lastWidthRef = useRef<number>(0);

  // Fit full Indonesian archipelago on initial mount & when island filter changes
  useEffect(() => {
    map.invalidateSize({ animate: false });

    if (selectedIslandGroup === "ALL") {
      map.fitBounds(INDONESIA_BOUNDS, {
        padding: [20, 20],
        maxZoom: 6,
        animate: true,
      });
      return;
    }

    const matching = provincesGeo.features.filter(
      (f) => f.properties?.islandGroup === selectedIslandGroup
    );
    if (matching.length > 0) {
      const layer = L.geoJSON({
        type: "FeatureCollection",
        features: matching,
      } as GeoJSON.FeatureCollection);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 7, animate: true });
      }
    }
  }, [map, provincesGeo, selectedIslandGroup]);

  // Coordinate ResizeObserver when side drawer collapses/expands or fullscreen toggles
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const newWidth = Math.round(entry.contentRect.width);

      map.invalidateSize({ animate: false });

      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        map.invalidateSize({ animate: false });
        if (
          selectedIslandGroup === "ALL" &&
          Math.abs(newWidth - lastWidthRef.current) > 40
        ) {
          lastWidthRef.current = newWidth;
          map.fitBounds(INDONESIA_BOUNDS, {
            padding: [20, 20],
            maxZoom: 6,
            animate: true,
          });
        }
      }, 260);
    });

    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [map, wrapperRef, selectedIslandGroup]);

  // Fly to province or district when triggered from the side drawer
  useEffect(() => {
    if (!flyToTarget) return;

    if (flyToTarget.type === "province") {
      const feat = provincesGeo.features.find(
        (f) =>
          String(f.id) === flyToTarget.id ||
          String(f.properties?.slug) === flyToTarget.id ||
          String(f.properties?.id) === flyToTarget.id
      );
      if (feat) {
        const layer = L.geoJSON(feat as GeoJSON.Feature);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [36, 36], maxZoom: 7, duration: 0.45 });
        }
      }
    } else if (flyToTarget.type === "district" && allKabGeo) {
      const feat = allKabGeo.features.find(
        (f) =>
          String(f.id) === flyToTarget.id ||
          String(f.properties?.id) === flyToTarget.id
      );
      if (feat) {
        const layer = L.geoJSON(feat as GeoJSON.Feature);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 8, duration: 0.45 });
        }
      }
    }
  }, [map, flyToTarget, provincesGeo, allKabGeo]);

  return null;
}

export default function LeafletNationalCanvas({
  provinces,
  mapData,
  provincesGeo,
  allKabGeo,
  layerMode,
  hoveredProvinceId,
  selectedIslandGroup,
  activeTierFilter = null,
  flyToTarget = null,
  onHoverProvince,
  onSelectProvince,
  onSelectDistrict,
}: LeafletNationalCanvasProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Single React state for floating tooltip — guarantees at most ONE tooltip can ever exist
  const [hoveredFeature, setHoveredFeature] =
    useState<HoveredTooltipState | null>(null);

  const provinceMap = useMemo(() => {
    const m = new Map<string, Province>();
    provinces.forEach((p) => {
      m.set(p.slug, p);
      m.set(p.id, p);
    });
    return m;
  }, [provinces]);

  // Clear tooltip when switching layer modes, island groups, or tier filter
  useEffect(() => {
    setHoveredFeature(null);
  }, [layerMode, selectedIslandGroup, activeTierFilter]);

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onMouseLeave={() => {
        setHoveredFeature(null);
        onHoverProvince(null);
      }}
    >
      <MapContainer
        bounds={INDONESIA_BOUNDS}
        boundsOptions={{ padding: [20, 20] }}
        minZoom={4}
        maxZoom={11}
        maxBounds={MAX_OCEAN_BOUNDS}
        maxBoundsViscosity={0.85}
        scrollWheelZoom={true}
        zoomControl={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapResizeAndBoundsController
          wrapperRef={wrapperRef}
          provincesGeo={provincesGeo}
          allKabGeo={allKabGeo}
          selectedIslandGroup={selectedIslandGroup}
          flyToTarget={flyToTarget}
        />

        {/* Mode 1: 514 Kabupaten/Kota Choropleth Heatmap directly from GET /api/map-data */}
        {layerMode === "kabupaten" && allKabGeo && (
          <GeoJSON
            key={`kab-layer-${selectedIslandGroup}-${activeTierFilter ?? "all"}-${hoveredProvinceId ?? "none"}-${isDark}`}
            data={allKabGeo}
            style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
              const domainId = String(
                feature?.id ?? feature?.properties?.id ?? ""
              );
              const entry = mapData[domainId];
              const islandGroup = String(
                feature?.properties?.islandGroup ?? ""
              );
              const provSlug = String(feature?.properties?.provinceSlug ?? "");
              const entryTier = entry?.tier ?? "Sedang";

              const isIslandFilteredOut =
                selectedIslandGroup !== "ALL" &&
                islandGroup !== selectedIslandGroup;
              const isTierFilteredOut =
                activeTierFilter !== null && entryTier !== activeTierFilter;
              const isFilteredOut = isIslandFilteredOut || isTierFilteredOut;

              const isHighlightedFromDrawer =
                hoveredProvinceId !== null &&
                (provSlug === hoveredProvinceId || domainId === hoveredProvinceId);

              const fillColor = entry?.color ?? "#eab308";

              return {
                fillColor,
                fillOpacity: isFilteredOut
                  ? 0.14
                  : isHighlightedFromDrawer
                  ? 0.95
                  : activeTierFilter !== null
                  ? 0.9
                  : 0.8,
                color: isHighlightedFromDrawer
                  ? isDark
                    ? "#2dd4bf"
                    : "#0f172a"
                  : isDark
                  ? "rgba(15, 23, 42, 0.72)"
                  : "rgba(255, 255, 255, 0.78)",
                weight: isHighlightedFromDrawer
                  ? 2.2
                  : activeTierFilter !== null && !isTierFilteredOut
                  ? 1.3
                  : 0.8,
              };
            }}
            onEachFeature={(
              feature: Feature<Geometry, GeoFeatureProperties>,
              layer: L.Layer
            ) => {
              const domainId = String(
                feature.id ?? feature.properties?.id ?? ""
              );
              const entry = mapData[domainId];
              const kabName =
                entry?.kabupaten ?? feature.properties?.name ?? domainId;
              const provName = entry?.provinsi ?? "";
              const provSlug =
                feature.properties?.provinceSlug ??
                resolveProvinceSlug(provName);
              const pred = entry?.pred ?? 0;
              const actual = entry?.actual ?? 0;
              const tier = entry?.tier ?? "Sedang";
              const badgeColor = entry?.color ?? "#eab308";
              const islandGroup = String(
                feature.properties?.islandGroup ?? ""
              );
              const isIslandFilteredOut =
                selectedIslandGroup !== "ALL" &&
                islandGroup !== selectedIslandGroup;
              const isTierFilteredOut =
                activeTierFilter !== null && tier !== activeTierFilter;
              const isFilteredOut = isIslandFilteredOut || isTierFilteredOut;

              const updateTooltip = (e: L.LeafletMouseEvent) => {
                setHoveredFeature({
                  title: String(kabName),
                  badgeText: `Pred ${pred}%`,
                  badgeColor,
                  subtitle: `Provinsi ${provName} · ID ${domainId}`,
                  footerLeft: `Tier: ${tier}`,
                  footerRight: `Aktual: ${actual}%`,
                  x: e.containerPoint.x,
                  y: e.containerPoint.y,
                });
              };

              layer.on({
                mouseover: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  target.setStyle({
                    weight: 2.4,
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fillOpacity: 0.95,
                  });
                  target.bringToFront();
                  updateTooltip(e);
                  onHoverProvince(provSlug);
                },
                mousemove: (e: L.LeafletMouseEvent) => {
                  updateTooltip(e);
                },
                mouseout: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  target.setStyle({
                    weight:
                      activeTierFilter !== null && !isTierFilteredOut ? 1.3 : 0.8,
                    color: isDark
                      ? "rgba(15, 23, 42, 0.72)"
                      : "rgba(255, 255, 255, 0.78)",
                    fillOpacity: isFilteredOut
                      ? 0.14
                      : activeTierFilter !== null
                      ? 0.9
                      : 0.8,
                  });
                  setHoveredFeature(null);
                  onHoverProvince(null);
                },
                click: () => {
                  setHoveredFeature(null);
                  onSelectDistrict(provSlug, domainId);
                },
              });
            }}
          />
        )}

        {/* Mode 2: 38 Province Choropleth Layer */}
        {layerMode === "province" && (
          <GeoJSON
            key={`prov-layer-${selectedIslandGroup}-${activeTierFilter ?? "all"}-${hoveredProvinceId ?? "none"}-${isDark}`}
            data={provincesGeo}
            style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
              const slug = String(
                feature?.id ??
                  feature?.properties?.slug ??
                  feature?.properties?.id ??
                  ""
              );
              const prov = provinceMap.get(slug);
              const provTier = prov
                ? getProvinceTierName(prov.avg_predicted)
                : "Sedang";

              const isIslandFilteredOut =
                selectedIslandGroup !== "ALL" &&
                prov?.islandGroup !== selectedIslandGroup;
              const isTierFilteredOut =
                activeTierFilter !== null && provTier !== activeTierFilter;
              const isFilteredOut = isIslandFilteredOut || isTierFilteredOut;

              const isHighlighted =
                hoveredProvinceId !== null &&
                (prov?.slug === hoveredProvinceId ||
                  prov?.id === hoveredProvinceId);

              const fillColor = prov
                ? getMapFillColor(prov.avg_predicted)
                : "#eab308";

              return {
                fillColor,
                fillOpacity: isFilteredOut
                  ? 0.15
                  : isHighlighted
                  ? 0.95
                  : activeTierFilter !== null
                  ? 0.9
                  : 0.8,
                color: isHighlighted
                  ? isDark
                    ? "#2dd4bf"
                    : "#0f172a"
                  : "rgba(15, 23, 42, 0.65)",
                weight: isHighlighted ? 2.5 : 1.3,
              };
            }}
            onEachFeature={(
              feature: Feature<Geometry, GeoFeatureProperties>,
              layer: L.Layer
            ) => {
              const slug = String(
                feature.id ??
                  feature.properties?.slug ??
                  feature.properties?.id ??
                  ""
              );
              const prov = provinceMap.get(slug);
              if (!prov) return;

              const provTier = getProvinceTierName(prov.avg_predicted);
              const isIslandFilteredOut =
                selectedIslandGroup !== "ALL" &&
                prov.islandGroup !== selectedIslandGroup;
              const isTierFilteredOut =
                activeTierFilter !== null && provTier !== activeTierFilter;
              const isFilteredOut = isIslandFilteredOut || isTierFilteredOut;

              const updateTooltip = (e: L.LeafletMouseEvent) => {
                setHoveredFeature({
                  title: prov.name,
                  badgeText: `Pred ${prov.avg_predicted}%`,
                  badgeColor: getMapFillColor(prov.avg_predicted),
                  subtitle: `${prov.islandGroup} · ${prov.n_kabupaten} Kab/Kota · Rank #${prov.nationalRank}/38`,
                  footerLeft: `Aktual: ${prov.avg_actual}%`,
                  footerRight: `Tertinggi: ${prov.highest_risk_kabupaten}`,
                  x: e.containerPoint.x,
                  y: e.containerPoint.y,
                });
              };

              layer.on({
                mouseover: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  target.setStyle({
                    weight: 2.8,
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fillOpacity: 0.92,
                  });
                  target.bringToFront();
                  updateTooltip(e);
                  onHoverProvince(prov.slug);
                },
                mousemove: (e: L.LeafletMouseEvent) => {
                  updateTooltip(e);
                },
                mouseout: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  target.setStyle({
                    weight: 1.3,
                    color: "rgba(15, 23, 42, 0.65)",
                    fillOpacity: isFilteredOut
                      ? 0.15
                      : activeTierFilter !== null
                      ? 0.9
                      : 0.8,
                  });
                  setHoveredFeature(null);
                  onHoverProvince(null);
                },
                click: () => {
                  setHoveredFeature(null);
                  onSelectProvince(prov.slug);
                },
              });
            }}
          />
        )}
      </MapContainer>

      {/* Single Floating React Tooltip — 100% impossible for multiple tooltips to stack */}
      {hoveredFeature && (
        <div
          className="pointer-events-none absolute z-[450] min-w-[200px] max-w-[260px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-border bg-popover/95 px-3 py-2.5 text-xs text-popover-foreground shadow-xl backdrop-blur-md"
          style={{
            left: `${Math.max(110, hoveredFeature.x)}px`,
            top: `${Math.max(85, hoveredFeature.y)}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <strong className="truncate text-[13px] font-bold text-foreground">
              {hoveredFeature.title}
            </strong>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white"
              style={{ backgroundColor: hoveredFeature.badgeColor }}
            >
              {hoveredFeature.badgeText}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {hoveredFeature.subtitle}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border/70 pt-1.5 text-[11px]">
            <span className="font-semibold text-foreground">
              {hoveredFeature.footerLeft}
            </span>
            <span className="truncate font-mono font-semibold text-muted-foreground">
              {hoveredFeature.footerRight}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
