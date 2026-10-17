"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";
import type { Feature, Geometry } from "geojson";
import type { Province, MapDataDictionary } from "@/lib/types";
import type { MapFeatureCollection, GeoFeatureProperties } from "@/lib/geo";
import { getMapFillColor } from "@/lib/colorScale";
import { resolveProvinceSlug } from "@/lib/api/mockAdapter";

export type RiskTierFilterValue =
  | "ALL"
  | "Rendah"
  | "Sedang"
  | "Tinggi"
  | "Sangat Tinggi";

// Full Indonesian archipelago bounds (Sabang to Merauke, Miangas to Rote)
const INDONESIA_BOUNDS: L.LatLngBoundsExpression = [
  [-11.2, 94.6],
  [6.2, 141.2],
];

// Panning lock bounds so users cannot pan into empty ocean
const MAX_OCEAN_BOUNDS: L.LatLngBoundsExpression = [
  [-15.5, 90.0],
  [10.5, 146.5],
];

interface LeafletNationalCanvasProps {
  provinces: Province[];
  mapData: MapDataDictionary;
  provincesGeo: MapFeatureCollection;
  allKabGeo: MapFeatureCollection | undefined;
  layerMode: "kabupaten" | "province";
  hoveredProvinceId: string | null;
  hoveredDistrictId?: string | null;
  selectedIslandGroup: string;
  selectedRiskTierFilter: RiskTierFilterValue;
  fitBoundsTrigger?: number;
  isDrawerCollapsed?: boolean;
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

function getTierFromScore(score: number): Exclude<RiskTierFilterValue, "ALL"> {
  if (score >= 35) return "Sangat Tinggi";
  if (score >= 28) return "Tinggi";
  if (score >= 20) return "Sedang";
  return "Rendah";
}

function MapViewportController({
  provincesGeo,
  allKabGeo,
  selectedIslandGroup,
  hoveredProvinceId,
  hoveredDistrictId,
  fitBoundsTrigger = 0,
  isDrawerCollapsed,
}: {
  provincesGeo: MapFeatureCollection;
  allKabGeo: MapFeatureCollection | undefined;
  selectedIslandGroup: string;
  hoveredProvinceId: string | null;
  hoveredDistrictId?: string | null;
  fitBoundsTrigger?: number;
  isDrawerCollapsed?: boolean;
}) {
  const map = useMap();
  const hasInitialFitRef = useRef(false);

  // 1. Initial Full-Archipelago Fit & Explicit Fit Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: false });
      map.fitBounds(INDONESIA_BOUNDS, {
        paddingTopLeft: [16, 56],
        paddingBottomRight: [16, 24],
        animate: hasInitialFitRef.current,
      });
      hasInitialFitRef.current = true;
    }, 60);
    return () => clearTimeout(timer);
  }, [map, fitBoundsTrigger]);

  // 2. ResizeObserver to handle collapsible drawer transitions & window resizes cleanly
  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === "undefined") return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
      });
    });

    observer.observe(container);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [map]);

  // 3. Re-invalidate and gently re-fit after drawer collapse/expand transition completes
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
      if (selectedIslandGroup === "ALL") {
        map.fitBounds(INDONESIA_BOUNDS, {
          paddingTopLeft: [16, 56],
          paddingBottomRight: [16, 24],
          animate: true,
        });
      }
    }, 310);
    return () => clearTimeout(timer);
  }, [map, isDrawerCollapsed, selectedIslandGroup]);

  // 4. Island Group filter bounds zoom
  useEffect(() => {
    if (!hasInitialFitRef.current) return;
    if (selectedIslandGroup === "ALL") {
      map.fitBounds(INDONESIA_BOUNDS, {
        paddingTopLeft: [16, 56],
        paddingBottomRight: [16, 24],
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
        map.fitBounds(bounds, {
          paddingTopLeft: [24, 68],
          paddingBottomRight: [24, 28],
          maxZoom: 7,
          animate: true,
        });
      }
    }
  }, [map, provincesGeo, selectedIslandGroup]);

  // 5. Optional subtle pan when hovering a Watchlist district row from the right drawer
  useEffect(() => {
    if (!hoveredDistrictId || !allKabGeo) return;
    const feat = allKabGeo.features.find(
      (f) =>
        String(f.id ?? f.properties?.id ?? "") === String(hoveredDistrictId)
    );
    if (feat) {
      const layer = L.geoJSON(feat as GeoJSON.Feature);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        const center = bounds.getCenter();
        if (!map.getBounds().contains(center)) {
          map.panTo(center, { animate: true });
        }
      }
    }
  }, [map, hoveredDistrictId, allKabGeo]);

  // Keep reference to hoveredProvinceId for lint cleanliness
  void hoveredProvinceId;

  return null;
}

export default function LeafletNationalCanvas({
  provinces,
  mapData,
  provincesGeo,
  allKabGeo,
  layerMode,
  hoveredProvinceId,
  hoveredDistrictId = null,
  selectedIslandGroup,
  selectedRiskTierFilter,
  fitBoundsTrigger = 0,
  isDrawerCollapsed = false,
  onHoverProvince,
  onSelectProvince,
  onSelectDistrict,
}: LeafletNationalCanvasProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  // Clear tooltip when switching layer modes, island groups, or risk-tier filters
  useEffect(() => {
    setHoveredFeature(null);
  }, [layerMode, selectedIslandGroup, selectedRiskTierFilter]);

  return (
    <div
      className="relative h-full w-full"
      onMouseLeave={() => {
        setHoveredFeature(null);
        onHoverProvince(null);
      }}
    >
      <MapContainer
        center={[-2.4, 118.0]}
        zoom={5}
        minZoom={4}
        maxZoom={10}
        maxBounds={MAX_OCEAN_BOUNDS}
        maxBoundsViscosity={0.85}
        zoomControl={false}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", minHeight: "520px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        <MapViewportController
          provincesGeo={provincesGeo}
          allKabGeo={allKabGeo}
          selectedIslandGroup={selectedIslandGroup}
          hoveredProvinceId={hoveredProvinceId}
          hoveredDistrictId={hoveredDistrictId}
          fitBoundsTrigger={fitBoundsTrigger}
          isDrawerCollapsed={isDrawerCollapsed}
        />

        {/* Mode 1: 514 Kabupaten/Kota Choropleth Heatmap directly from GET /api/map-data */}
        {layerMode === "kabupaten" && allKabGeo && (
          <GeoJSON
            key={`kab-layer-${selectedIslandGroup}-${selectedRiskTierFilter}-${hoveredDistrictId ?? "none"}-${hoveredProvinceId ?? "none"}-${isDark}`}
            data={allKabGeo}
            style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
              const domainId = String(
                feature?.id ?? feature?.properties?.id ?? ""
              );
              const entry = mapData[domainId];
              const provSlug = String(
                feature?.properties?.provinceSlug ??
                  resolveProvinceSlug(entry?.provinsi ?? "")
              );
              const islandGroup = String(
                feature?.properties?.islandGroup ?? ""
              );
              const tier = entry?.tier ?? "Sedang";

              const matchesIsland =
                selectedIslandGroup === "ALL" ||
                islandGroup === selectedIslandGroup;
              const matchesTier =
                selectedRiskTierFilter === "ALL" ||
                tier === selectedRiskTierFilter;
              const isFilteredOut = !matchesIsland || !matchesTier;

              const isDrawerHighlighted =
                (hoveredDistrictId !== null &&
                  String(hoveredDistrictId) === domainId) ||
                (hoveredProvinceId !== null && hoveredProvinceId === provSlug);

              const fillColor = entry?.color ?? "#eab308";

              return {
                fillColor,
                fillOpacity: isDrawerHighlighted
                  ? 0.96
                  : isFilteredOut
                  ? 0.13
                  : selectedRiskTierFilter !== "ALL"
                  ? 0.9
                  : 0.8,
                color: isDrawerHighlighted
                  ? "#fbbf24"
                  : selectedRiskTierFilter !== "ALL" && matchesTier
                  ? isDark
                    ? "#f8fafc"
                    : "#0f172a"
                  : isDark
                  ? "rgba(15, 23, 42, 0.72)"
                  : "rgba(255, 255, 255, 0.78)",
                weight: isDrawerHighlighted
                  ? 2.6
                  : selectedRiskTierFilter !== "ALL" && matchesTier
                  ? 1.3
                  : 0.75,
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

              const matchesIsland =
                selectedIslandGroup === "ALL" ||
                islandGroup === selectedIslandGroup;
              const matchesTier =
                selectedRiskTierFilter === "ALL" ||
                tier === selectedRiskTierFilter;
              const isFilteredOut = !matchesIsland || !matchesTier;

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
                    fillOpacity: 0.96,
                  });
                  target.bringToFront();
                  updateTooltip(e);
                },
                mousemove: (e: L.LeafletMouseEvent) => {
                  updateTooltip(e);
                },
                mouseout: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  target.setStyle({
                    weight:
                      selectedRiskTierFilter !== "ALL" && matchesTier
                        ? 1.3
                        : 0.75,
                    color:
                      selectedRiskTierFilter !== "ALL" && matchesTier
                        ? isDark
                          ? "#f8fafc"
                          : "#0f172a"
                        : isDark
                        ? "rgba(15, 23, 42, 0.72)"
                        : "rgba(255, 255, 255, 0.78)",
                    fillOpacity: isFilteredOut
                      ? 0.13
                      : selectedRiskTierFilter !== "ALL"
                      ? 0.9
                      : 0.8,
                  });
                  setHoveredFeature(null);
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
            key={`prov-layer-${selectedIslandGroup}-${selectedRiskTierFilter}-${hoveredProvinceId ?? "none"}-${isDark}`}
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
                ? getTierFromScore(prov.avg_predicted)
                : "Sedang";

              const matchesIsland =
                selectedIslandGroup === "ALL" ||
                prov?.islandGroup === selectedIslandGroup;
              const matchesTier =
                selectedRiskTierFilter === "ALL" ||
                provTier === selectedRiskTierFilter;
              const isFilteredOut = !matchesIsland || !matchesTier;

              const isDrawerHighlighted =
                hoveredProvinceId !== null &&
                (hoveredProvinceId === slug || hoveredProvinceId === prov?.id);

              const fillColor = prov
                ? getMapFillColor(prov.avg_predicted)
                : "#eab308";

              return {
                fillColor,
                fillOpacity: isDrawerHighlighted
                  ? 0.95
                  : isFilteredOut
                  ? 0.14
                  : 0.82,
                color: isDrawerHighlighted
                  ? "#fbbf24"
                  : "rgba(15, 23, 42, 0.65)",
                weight: isDrawerHighlighted ? 2.8 : 1.3,
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

              const provTier = getTierFromScore(prov.avg_predicted);
              const matchesIsland =
                selectedIslandGroup === "ALL" ||
                prov.islandGroup === selectedIslandGroup;
              const matchesTier =
                selectedRiskTierFilter === "ALL" ||
                provTier === selectedRiskTierFilter;
              const isFilteredOut = !matchesIsland || !matchesTier;

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
                    fillOpacity: 0.94,
                  });
                  target.bringToFront();
                  updateTooltip(e);
                },
                mousemove: (e: L.LeafletMouseEvent) => {
                  updateTooltip(e);
                },
                mouseout: (e: L.LeafletMouseEvent) => {
                  const target = e.target as L.Path;
                  target.setStyle({
                    weight: 1.3,
                    color: "rgba(15, 23, 42, 0.65)",
                    fillOpacity: isFilteredOut ? 0.14 : 0.82,
                  });
                  setHoveredFeature(null);
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
          className="pointer-events-none absolute z-[1000] min-w-[205px] max-w-[265px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-border bg-popover/95 px-3 py-2.5 text-xs text-popover-foreground shadow-xl backdrop-blur-md"
          style={{
            left: `${Math.max(115, hoveredFeature.x)}px`,
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
