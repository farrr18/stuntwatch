"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";
import type { Feature, Geometry } from "geojson";
import type { Province, MapDataDictionary } from "@/lib/types";
import type { MapFeatureCollection, GeoFeatureProperties } from "@/lib/geo";
import { getMapFillColor } from "@/lib/colorScale";
import { resolveProvinceSlug } from "@/lib/api/mockAdapter";

interface LeafletNationalCanvasProps {
  provinces: Province[];
  mapData: MapDataDictionary;
  provincesGeo: MapFeatureCollection;
  allKabGeo: MapFeatureCollection | undefined;
  layerMode: "kabupaten" | "province";
  hoveredProvinceId: string | null;
  selectedIslandGroup: string;
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

function IslandBoundsUpdater({
  provincesGeo,
  selectedIslandGroup,
}: {
  provincesGeo: MapFeatureCollection;
  selectedIslandGroup: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedIslandGroup === "ALL") {
      map.setView([-2.4, 118.0], 5, { animate: true });
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
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
      }
    }
  }, [map, provincesGeo, selectedIslandGroup]);

  return null;
}

export default function LeafletNationalCanvas({
  provinces,
  mapData,
  provincesGeo,
  allKabGeo,
  layerMode,
  selectedIslandGroup,
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

  // Clear tooltip when switching layer modes or island groups
  useEffect(() => {
    setHoveredFeature(null);
  }, [layerMode, selectedIslandGroup]);

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
        scrollWheelZoom={true}
        className="h-full w-full rounded-xl"
        style={{ height: "100%", width: "100%", minHeight: "420px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <IslandBoundsUpdater
          provincesGeo={provincesGeo}
          selectedIslandGroup={selectedIslandGroup}
        />

        {/* Mode 1: 514 Kabupaten/Kota Choropleth Heatmap directly from GET /api/map-data */}
        {layerMode === "kabupaten" && allKabGeo && (
          <GeoJSON
            key={`kab-layer-${selectedIslandGroup}-${isDark}`}
            data={allKabGeo}
            style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
              const domainId = String(
                feature?.id ?? feature?.properties?.id ?? ""
              );
              const entry = mapData[domainId];
              const islandGroup = String(
                feature?.properties?.islandGroup ?? ""
              );
              const isFilteredOut =
                selectedIslandGroup !== "ALL" &&
                islandGroup !== selectedIslandGroup;

              const fillColor = entry?.color ?? "#eab308";

              return {
                fillColor,
                fillOpacity: isFilteredOut ? 0.12 : 0.78,
                color: isDark
                  ? "rgba(15, 23, 42, 0.7)"
                  : "rgba(255, 255, 255, 0.75)",
                weight: 0.8,
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
              const isFilteredOut =
                selectedIslandGroup !== "ALL" &&
                islandGroup !== selectedIslandGroup;

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
                    weight: 0.8,
                    color: isDark
                      ? "rgba(15, 23, 42, 0.7)"
                      : "rgba(255, 255, 255, 0.75)",
                    fillOpacity: isFilteredOut ? 0.12 : 0.78,
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
            key={`prov-layer-${selectedIslandGroup}-${isDark}`}
            data={provincesGeo}
            style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
              const slug = String(
                feature?.id ??
                  feature?.properties?.slug ??
                  feature?.properties?.id ??
                  ""
              );
              const prov = provinceMap.get(slug);
              const isFilteredOut =
                selectedIslandGroup !== "ALL" &&
                prov?.islandGroup !== selectedIslandGroup;

              const fillColor = prov
                ? getMapFillColor(prov.avg_predicted)
                : "#eab308";

              return {
                fillColor,
                fillOpacity: isFilteredOut ? 0.15 : 0.78,
                color: "rgba(15, 23, 42, 0.65)",
                weight: 1.3,
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

              const isFilteredOut =
                selectedIslandGroup !== "ALL" &&
                prov.islandGroup !== selectedIslandGroup;

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
                    fillOpacity: isFilteredOut ? 0.15 : 0.78,
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
          className="pointer-events-none absolute z-[1000] min-w-[200px] max-w-[260px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-border bg-popover/95 px-3 py-2.5 text-xs text-popover-foreground shadow-xl backdrop-blur-md transition- none"
          style={{
            left: `${Math.max(110, hoveredFeature.x)}px`,
            top: `${Math.max(75, hoveredFeature.y)}px`,
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
