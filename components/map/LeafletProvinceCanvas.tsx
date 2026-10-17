"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";
import type { Feature, Geometry } from "geojson";
import type { KabKota, MapDataDictionary } from "@/lib/types";
import type { MapFeatureCollection, GeoFeatureProperties } from "@/lib/geo";
import { getMapFillColor } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface LeafletProvinceCanvasProps {
  provinceId: string;
  geoData: MapFeatureCollection;
  kabKotaList: KabKota[];
  mapData: MapDataDictionary | undefined;
  selectedKabKotaId: string;
  hoveredKabKotaId: string | null;
  onSelectKabKota: (kabKotaId: string) => void;
  onHoverKabKota: (kabKotaId: string | null) => void;
}

interface HoveredDistrictTooltip {
  name: string;
  kabId: string;
  actual: number;
  pred: number;
  tier: string;
  topFeature: string;
  topShap: number;
  badgeColor: string;
  x: number;
  y: number;
}

function ProvinceBoundsFitter({
  wrapperRef,
  geoData,
  provinceId,
}: {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  geoData: MapFeatureCollection;
  provinceId: string;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize({ animate: false });
    const layer = L.geoJSON(geoData as GeoJSON.FeatureCollection);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 9 });
    }
  }, [map, geoData, provinceId]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, 220);
    });

    observer.observe(el);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [map, wrapperRef]);

  return null;
}

export default function LeafletProvinceCanvas({
  provinceId,
  geoData,
  kabKotaList,
  mapData,
  selectedKabKotaId,
  hoveredKabKotaId,
  onSelectKabKota,
  onHoverKabKota,
}: LeafletProvinceCanvasProps) {
  const { resolvedTheme } = useTheme();
  const { locale } = useAppLocale();
  const isDark = resolvedTheme === "dark";
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Single React state for floating tooltip — guarantees at most ONE tooltip can ever exist
  const [hoveredFeature, setHoveredFeature] =
    useState<HoveredDistrictTooltip | null>(null);

  const kabMap = useMemo(() => {
    const m = new Map<string, KabKota>();
    kabKotaList.forEach((k) => {
      m.set(k.id, k);
      m.set(String(k.domain_id), k);
    });
    return m;
  }, [kabKotaList]);

  useEffect(() => {
    setHoveredFeature(null);
  }, [provinceId, selectedKabKotaId]);

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      onMouseLeave={() => {
        setHoveredFeature(null);
        onHoverKabKota(null);
      }}
    >
      <MapContainer
        center={[-2.5, 118.0]}
        zoom={6}
        minZoom={4}
        maxZoom={11}
        scrollWheelZoom={true}
        zoomControl={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", minHeight: "460px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ProvinceBoundsFitter
          wrapperRef={wrapperRef}
          geoData={geoData}
          provinceId={provinceId}
        />

        <GeoJSON
          key={`prov-kab-${provinceId}-${selectedKabKotaId}-${hoveredKabKotaId ?? "none"}-${isDark}`}
          data={geoData}
          style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
            const kabId = String(feature?.id ?? feature?.properties?.id ?? "");
            const kab = kabMap.get(kabId);
            const mapEntry = mapData?.[kabId];

            const isSelected = selectedKabKotaId === kabId;
            const isHovered = hoveredKabKotaId === kabId;

            const fillColor =
              mapEntry?.color ??
              (kab ? getMapFillColor(kab.actual) : "#eab308");

            return {
              fillColor,
              fillOpacity: isSelected || isHovered ? 0.95 : 0.8,
              color: isSelected
                ? "#fbbf24"
                : isHovered
                ? "#2dd4bf"
                : isDark
                ? "rgba(15, 23, 42, 0.8)"
                : "rgba(255, 255, 255, 0.85)",
              weight: isSelected ? 3.2 : isHovered ? 2.6 : 1.2,
            };
          }}
          onEachFeature={(
            feature: Feature<Geometry, GeoFeatureProperties>,
            layer: L.Layer
          ) => {
            const kabId = String(feature.id ?? feature.properties?.id ?? "");
            const kab = kabMap.get(kabId);
            const mapEntry = mapData?.[kabId];
            if (!kab && !mapEntry) return;

            const name = String(
              kab?.name ??
                mapEntry?.kabupaten ??
                feature.properties?.name ??
                kabId
            );
            const actual = kab?.actual ?? mapEntry?.actual ?? 0;
            const pred = kab?.prediction ?? mapEntry?.pred ?? 0;
            const tier = kab?.risk_tier ?? mapEntry?.tier ?? "Sedang";
            const topFeature = kab?.topDriverLabel[locale] ?? "-";
            const topShap = kab?.top_feature_shap ?? 0;
            const badgeColor =
              mapEntry?.color ?? (kab ? getMapFillColor(kab.actual) : "#D9463E");
            const isSelected = selectedKabKotaId === kabId;

            const updateTooltip = (e: L.LeafletMouseEvent) => {
              setHoveredFeature({
                name,
                kabId,
                actual,
                pred,
                tier,
                topFeature,
                topShap,
                badgeColor,
                x: e.containerPoint.x,
                y: e.containerPoint.y,
              });
            };

            layer.on({
              mouseover: (e: L.LeafletMouseEvent) => {
                const target = e.target as L.Path;
                target.setStyle({
                  weight: isSelected ? 3.4 : 2.5,
                  color: isSelected
                    ? "#fbbf24"
                    : isDark
                    ? "#f8fafc"
                    : "#0f172a",
                  fillOpacity: 0.95,
                });
                target.bringToFront();
                updateTooltip(e);
                onHoverKabKota(kabId);
              },
              mousemove: (e: L.LeafletMouseEvent) => {
                updateTooltip(e);
              },
              mouseout: (e: L.LeafletMouseEvent) => {
                const target = e.target as L.Path;
                target.setStyle({
                  weight: isSelected ? 3.2 : 1.2,
                  color: isSelected
                    ? "#fbbf24"
                    : isDark
                    ? "rgba(15, 23, 42, 0.8)"
                    : "rgba(255, 255, 255, 0.85)",
                  fillOpacity: isSelected ? 0.95 : 0.8,
                });
                setHoveredFeature(null);
                onHoverKabKota(null);
              },
              click: () => {
                setHoveredFeature(null);
                onSelectKabKota(kabId);
              },
            });
          }}
        />
      </MapContainer>

      {/* Single Floating React Tooltip — 100% impossible for multiple tooltips to stack */}
      {hoveredFeature && (
        <div
          className="pointer-events-none absolute z-[1000] min-w-[205px] max-w-[265px] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-border bg-popover/95 px-3 py-2.5 text-xs text-popover-foreground shadow-xl backdrop-blur-md"
          style={{
            left: `${Math.max(110, hoveredFeature.x)}px`,
            top: `${Math.max(75, hoveredFeature.y)}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <strong className="truncate text-[13px] font-bold text-foreground">
              {hoveredFeature.name}
            </strong>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold text-white"
              style={{ backgroundColor: hoveredFeature.badgeColor }}
            >
              Act {hoveredFeature.actual}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            ID {hoveredFeature.kabId} · Prediksi:{" "}
            <strong className="text-foreground">{hoveredFeature.pred}%</strong>{" "}
            ({hoveredFeature.tier})
          </div>
          <div className="mt-1.5 border-t border-border/70 pt-1.5 text-[11px] text-muted-foreground">
            Top SHAP:{" "}
            <strong className="text-foreground">
              {hoveredFeature.topFeature} (+{hoveredFeature.topShap})
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}
