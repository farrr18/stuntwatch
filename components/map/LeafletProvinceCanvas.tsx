"use client";

import React, { useMemo, useEffect } from "react";
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

function ProvinceBoundsFitter({
  geoData,
  provinceId,
}: {
  geoData: MapFeatureCollection;
  provinceId: string;
}) {
  const map = useMap();

  useEffect(() => {
    const layer = L.geoJSON(geoData as GeoJSON.FeatureCollection);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [22, 22], maxZoom: 9 });
    }
  }, [map, geoData, provinceId]);

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

  const kabMap = useMemo(() => {
    const m = new Map<string, KabKota>();
    kabKotaList.forEach((k) => {
      m.set(k.id, k);
      m.set(String(k.domain_id), k);
    });
    return m;
  }, [kabKotaList]);

  return (
    <MapContainer
      center={[-2.5, 118.0]}
      zoom={6}
      minZoom={4}
      maxZoom={11}
      scrollWheelZoom={true}
      className="h-full w-full rounded-xl"
      style={{ height: "100%", width: "100%", minHeight: "420px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ProvinceBoundsFitter geoData={geoData} provinceId={provinceId} />

      <GeoJSON
        key={`prov-kab-${provinceId}-${selectedKabKotaId}-${hoveredKabKotaId}-${isDark}`}
        data={geoData}
        style={(feature?: Feature<Geometry, GeoFeatureProperties>) => {
          const kabId = String(feature?.id ?? feature?.properties?.id ?? "");
          const kab = kabMap.get(kabId);
          const mapEntry = mapData?.[kabId];

          const isSelected = selectedKabKotaId === kabId;
          const isHovered = hoveredKabKotaId === kabId;
          const isActive = isSelected || isHovered;

          const fillColor =
            mapEntry?.color ??
            (kab ? getMapFillColor(kab.actual) : "#eab308");

          return {
            fillColor,
            fillOpacity: isActive ? 0.95 : 0.78,
            color: isSelected
              ? "#fbbf24"
              : isHovered
              ? isDark
                ? "#f8fafc"
                : "#0f172a"
              : isDark
              ? "rgba(15, 23, 42, 0.8)"
              : "rgba(255, 255, 255, 0.85)",
            weight: isSelected ? 3.2 : isHovered ? 2.4 : 1.2,
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

          const name =
            kab?.name ?? mapEntry?.kabupaten ?? feature.properties?.name ?? kabId;
          const actual = kab?.actual ?? mapEntry?.actual ?? 0;
          const pred = kab?.prediction ?? mapEntry?.pred ?? 0;
          const tier = kab?.risk_tier ?? mapEntry?.tier ?? "Sedang";
          const topFeature = kab?.topDriverLabel[locale] ?? "-";
          const topShap = kab?.top_feature_shap ?? 0;
          const badgeColor = mapEntry?.color ?? "#D9463E";

          const html = `
            <div style="min-width: 195px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <strong style="font-size:13px;">${name}</strong>
                <span style="background:${badgeColor};color:#fff;padding:1px 6px;border-radius:4px;font-weight:700;font-family:monospace;font-size:11px;">
                  Act ${actual}%
                </span>
              </div>
              <div style="margin-top:3px;font-size:11px;opacity:0.8;">
                ID ${kabId} · Prediksi: <strong>${pred}%</strong> (${tier})
              </div>
              <div style="margin-top:5px;padding-top:4px;border-top:1px solid rgba(148,163,184,0.3);font-size:11px;">
                Top SHAP: <strong>${topFeature} (+${topShap})</strong>
              </div>
            </div>
          `;

          layer.bindTooltip(html, {
            sticky: true,
            direction: "top",
            className: "stuntwatch-leaflet-tooltip",
          });

          layer.on({
            mouseover: () => onHoverKabKota(kabId),
            mouseout: () => onHoverKabKota(null),
            click: () => onSelectKabKota(kabId),
          });
        }}
      />
    </MapContainer>
  );
}
