"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Layers, MapPin } from "lucide-react";
import type { Province } from "@/lib/types";
import {
  useMapData,
  useProvincesGeo,
  useAllKabKotaGeo,
} from "@/lib/hooks/useStuntingData";
import { MapLegend } from "./MapLegend";

const LeafletNationalCanvas = dynamic(
  () => import("./LeafletNationalCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[430px] w-full flex-col items-center justify-center rounded-xl bg-sky-50/60 dark:bg-slate-900/70">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          Initializing Interactive Leaflet Choropleth Heatmap...
        </p>
      </div>
    ),
  }
);

interface IndonesiaMapProps {
  provinces: Province[];
  hoveredProvinceId: string | null;
  onHoverProvince: (id: string | null) => void;
  selectedIslandGroup: string;
}

export function IndonesiaMap({
  provinces,
  hoveredProvinceId,
  onHoverProvince,
  selectedIslandGroup,
}: IndonesiaMapProps) {
  const router = useRouter();
  const t = useTranslations("national");

  // Live Endpoint: GET /api/map-data
  const { data: mapData, isLoading: isLoadingMapData } = useMapData();
  const { data: provincesGeo, isLoading: isLoadingProvGeo } = useProvincesGeo();
  const { data: allKabGeo } = useAllKabKotaGeo();

  const [layerMode, setLayerMode] = useState<"kabupaten" | "province">(
    "kabupaten"
  );

  // Compute tier counts across all 514 districts in /api/map-data
  const mapTierCounts = useMemo(() => {
    const counts = {
      "Sangat Tinggi": 0,
      Tinggi: 0,
      Sedang: 0,
      Rendah: 0,
      total: 0,
    };
    if (!mapData) return counts;
    for (const entry of Object.values(mapData)) {
      counts.total += 1;
      if (entry.tier === "Sangat Tinggi") counts["Sangat Tinggi"] += 1;
      else if (entry.tier === "Tinggi") counts.Tinggi += 1;
      else if (entry.tier === "Sedang") counts.Sedang += 1;
      else counts.Rendah += 1;
    }
    return counts;
  }, [mapData]);

  if (isLoadingMapData || isLoadingProvGeo || !mapData || !provincesGeo) {
    return (
      <div className="flex h-[540px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Loading Leaflet Heatmap (`/api/map-data`)...
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Top Bar: Layer Switcher + Live /api/map-data Tier Summary */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-[#D9463E] animate-pulse" />
          <span className="font-medium text-foreground">
            {t("clickToDrillDown")} ({mapTierCounts.total} Kab/Kota via{" "}
            <code className="font-mono text-[11px] text-[#159A7C] dark:text-[#2DD4BF]">
              /api/map-data
            </code>
            )
          </span>
        </div>

        {/* Layer Mode Toggle: 514 Kab/Kota (/api/map-data) vs 38 Provinces */}
        <div
          role="group"
          aria-label="Map layer mode"
          className="inline-flex items-center rounded-lg border border-border bg-muted/60 p-0.5 text-[11px] font-semibold"
        >
          <button
            type="button"
            onClick={() => setLayerMode("kabupaten")}
            aria-pressed={layerMode === "kabupaten"}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
              layerMode === "kabupaten"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapPin className="h-3 w-3 text-[#D9463E]" />
            <span>514 Kab/Kota</span>
          </button>
          <button
            type="button"
            onClick={() => setLayerMode("province")}
            aria-pressed={layerMode === "province"}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
              layerMode === "province"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3 w-3 text-[#159A7C]" />
            <span>38 Provinsi</span>
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative h-[430px] w-full overflow-hidden rounded-xl border border-border/60 bg-sky-50/50 dark:bg-slate-900/70">
        <LeafletNationalCanvas
          provinces={provinces}
          mapData={mapData}
          provincesGeo={provincesGeo}
          allKabGeo={allKabGeo}
          layerMode={layerMode}
          hoveredProvinceId={hoveredProvinceId}
          selectedIslandGroup={selectedIslandGroup}
          onHoverProvince={onHoverProvince}
          onSelectProvince={(slug) => router.push(`/provinsi/${slug}`)}
          onSelectDistrict={(provSlug, domainId) =>
            router.push(`/provinsi/${provSlug}/${domainId}`)
          }
        />
      </div>

      {/* Live /api/map-data Tier Breakdown Bar */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center font-mono text-xs">
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5">
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            Rendah
          </span>
          <span className="font-bold text-foreground">
            {mapTierCounts.Rendah}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5">
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" />
            Sedang
          </span>
          <span className="font-bold text-foreground">
            {mapTierCounts.Sedang}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5">
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold text-orange-800 dark:text-orange-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
            Tinggi
          </span>
          <span className="font-bold text-foreground">
            {mapTierCounts.Tinggi}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5">
          <span className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold text-rose-800 dark:text-rose-300">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
            S.Tinggi
          </span>
          <span className="font-bold text-foreground">
            {mapTierCounts["Sangat Tinggi"]}
          </span>
        </div>
      </div>

      {/* Bottom-Docked MapLegend */}
      <div className="mt-3">
        <MapLegend />
      </div>
    </div>
  );
}
