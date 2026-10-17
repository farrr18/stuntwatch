"use client";

import React, { useMemo, useEffect } from "react";
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
      } as FeatureCollection);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
      }
    }
  }, [map, provincesGeo, selectedIslandGroup]);

  return null;
}

type FeatureCollection = GeoJSON.FeatureCollection;

export default function LeafletNationalCanvas({
  provinces,
  mapData,
  provincesGeo,
  allKabGeo,
  layerMode,
  hoveredProvinceId,
  selectedIslandGroup,
  onHoverProvince,
  onSelectProvince,
  onSelectDistrict,
}: LeafletNationalCanvasProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const provinceMap = useMemo(() => {
    const m = new Map<string, Province>();
    provinces.forEach((p) => {
      m.set(p.slug, p);
      m.set(p.id, p);
    });
    return m;
  }, [provinces]);

  return (
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
            const provSlug = String(feature?.properties?.provinceSlug ?? "");
            const islandGroup = String(feature?.properties?.islandGroup ?? "");
            const isFilteredOut =
              selectedIslandGroup !== "ALL" &&
              islandGroup !== selectedIslandGroup;
            const isProvHovered =
              hoveredProvinceId !== null && hoveredProvinceId === provSlug;

            const fillColor = entry?.color ?? "#eab308";

            return {
              fillColor,
              fillOpacity: isFilteredOut ? 0.12 : isProvHovered ? 0.92 : 0.78,
              color: isProvHovered
                ? "#0f172a"
                : isDark
                ? "rgba(15, 23, 42, 0.7)"
                : "rgba(255, 255, 255, 0.75)",
              weight: isProvHovered ? 2 : 0.8,
            };
          }}
          onEachFeature={(
            feature: Feature<Geometry, GeoFeatureProperties>,
            layer: L.Layer
          ) => {
            const domainId = String(feature.id ?? feature.properties?.id ?? "");
            const entry = mapData[domainId];
            const kabName =
              entry?.kabupaten ?? feature.properties?.name ?? domainId;
            const provName = entry?.provinsi ?? "";
            const provSlug =
              feature.properties?.provinceSlug ?? resolveProvinceSlug(provName);
            const pred = entry?.pred ?? 0;
            const actual = entry?.actual ?? 0;
            const tier = entry?.tier ?? "Sedang";
            const badgeColor = entry?.color ?? "#eab308";

            const html = `
              <div style="min-width: 185px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <strong style="font-size:13px;">${kabName}</strong>
                  <span style="background:${badgeColor};color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;font-family:monospace;font-size:11px;">
                    Pred ${pred}%
                  </span>
                </div>
                <div style="margin-top:3px;font-size:11px;opacity:0.8;">
                  Provinsi ${provName} · ID ${domainId}
                </div>
                <div style="margin-top:5px;padding-top:4px;border-top:1px solid rgba(148,163,184,0.3);display:flex;justify-content:space-between;font-size:11px;">
                  <span>Tier: <strong>${tier}</strong></span>
                  <span style="font-family:monospace;">Aktual: <strong>${actual}%</strong></span>
                </div>
              </div>
            `;

            layer.bindTooltip(html, {
              sticky: true,
              direction: "top",
              className: "stuntwatch-leaflet-tooltip",
            });

            layer.on({
              mouseover: (e: L.LeafletMouseEvent) => {
                const target = e.target as L.Path;
                target.setStyle({
                  weight: 2.4,
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fillOpacity: 0.95,
                });
                target.bringToFront();
                onHoverProvince(provSlug);
              },
              mouseout: (e: L.LeafletMouseEvent) => {
                const target = e.target as L.Path;
                target.setStyle({
                  weight: 0.8,
                  color: isDark
                    ? "rgba(15, 23, 42, 0.7)"
                    : "rgba(255, 255, 255, 0.75)",
                  fillOpacity: 0.78,
                });
                onHoverProvince(null);
              },
              click: () => {
                onSelectDistrict(provSlug, domainId);
              },
            });
          }}
        />
      )}

      {/* Mode 2: 38 Province Choropleth Layer */}
      {layerMode === "province" && (
        <GeoJSON
          key={`prov-layer-${selectedIslandGroup}-${hoveredProvinceId}-${isDark}`}
          data={provincesGeo}
          style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
            const slug = String(
              feature?.id ??
                (feature?.properties as Record<string, unknown>)?.slug ??
                feature?.properties?.id ??
                ""
            );
            const prov = provinceMap.get(slug);
            const isHovered =
              hoveredProvinceId === slug || hoveredProvinceId === prov?.id;
            const isFilteredOut =
              selectedIslandGroup !== "ALL" &&
              prov?.islandGroup !== selectedIslandGroup;

            const fillColor = prov
              ? getMapFillColor(prov.avg_predicted)
              : "#eab308";

            return {
              fillColor,
              fillOpacity: isFilteredOut ? 0.15 : isHovered ? 0.92 : 0.78,
              color: isHovered
                ? isDark
                  ? "#f8fafc"
                  : "#0f172a"
                : "rgba(15, 23, 42, 0.65)",
              weight: isHovered ? 2.8 : 1.3,
            };
          }}
          onEachFeature={(
            feature: Feature<Geometry, GeoFeatureProperties>,
            layer: L.Layer
          ) => {
            const slug = String(
              feature.id ??
                (feature.properties as Record<string, unknown>)?.slug ??
                feature.properties?.id ??
                ""
            );
            const prov = provinceMap.get(slug);
            if (!prov) return;

            const html = `
              <div style="min-width: 190px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                  <strong style="font-size:13px;">${prov.name}</strong>
                  <span style="background:#D9463E;color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;font-family:monospace;font-size:11px;">
                    Pred ${prov.avg_predicted}%
                  </span>
                </div>
                <div style="margin-top:3px;font-size:11px;opacity:0.8;">
                  ${prov.islandGroup} · ${prov.n_kabupaten} Kab/Kota · Rank #${prov.nationalRank}/38
                </div>
                <div style="margin-top:5px;padding-top:4px;border-top:1px solid rgba(148,163,184,0.3);display:flex;justify-content:space-between;font-size:11px;">
                  <span>Aktual: <strong>${prov.avg_actual}%</strong></span>
                  <span>Tertinggi: <strong>${prov.highest_risk_kabupaten}</strong></span>
                </div>
              </div>
            `;

            layer.bindTooltip(html, {
              sticky: true,
              direction: "top",
              className: "stuntwatch-leaflet-tooltip",
            });

            layer.on({
              mouseover: () => onHoverProvince(prov.slug),
              mouseout: () => onHoverProvince(null),
              click: () => onSelectProvince(prov.slug),
            });
          }}
        />
      )}
    </MapContainer>
  );
}
