"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import type { Province } from "@/lib/types";
import {
  useMapData,
  useProvincesGeo,
  useAllKabKotaGeo,
} from "@/lib/hooks/useStuntingData";
import { useAppLocale } from "@/lib/i18n";
import { MapLegend } from "./MapLegend";
import type { MapTierFilter } from "./LeafletNationalCanvas";

const LeafletNationalCanvas = dynamic(
  () => import("./LeafletNationalCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-sky-50/60 dark:bg-slate-900/80">
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
  flyToTarget?: {
    type: "province" | "district";
    id: string;
    timestamp: number;
  } | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function IndonesiaMap({
  provinces,
  hoveredProvinceId,
  onHoverProvince,
  selectedIslandGroup,
  flyToTarget = null,
  isFullscreen = false,
  onToggleFullscreen,
}: IndonesiaMapProps) {
  const router = useRouter();
  const { locale } = useAppLocale();

  // Live Endpoint: GET /api/map-data
  const { data: mapData, isLoading: isLoadingMapData } = useMapData();
  const { data: provincesGeo, isLoading: isLoadingProvGeo } = useProvincesGeo();
  const { data: allKabGeo } = useAllKabKotaGeo();

  const [layerMode, setLayerMode] = useState<"kabupaten" | "province">(
    "kabupaten"
  );
  const [activeTierFilter, setActiveTierFilter] =
    useState<MapTierFilter>(null);

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

  const handleToggleTier = (
    tier: "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi"
  ) => {
    setActiveTierFilter((prev) => (prev === tier ? null : tier));
  };

  if (isLoadingMapData || isLoadingProvGeo || !mapData || !provincesGeo) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-sky-50/50 dark:bg-slate-900/80 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Loading Leaflet Heatmap (`/api/map-data`)...
        </p>
      </div>
    );
  }

  const TIER_CHIPS: Array<{
    key: "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";
    label: string;
    count: number;
    dotColor: string;
    activeClass: string;
  }> = [
    {
      key: "Rendah",
      label: "Rendah",
      count: mapTierCounts.Rendah,
      dotColor: "bg-[#22c55e]",
      activeClass:
        "border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/50",
    },
    {
      key: "Sedang",
      label: "Sedang",
      count: mapTierCounts.Sedang,
      dotColor: "bg-[#eab308]",
      activeClass:
        "border-amber-500 bg-amber-500/20 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/50",
    },
    {
      key: "Tinggi",
      label: "Tinggi",
      count: mapTierCounts.Tinggi,
      dotColor: "bg-[#f97316]",
      activeClass:
        "border-orange-500 bg-orange-500/20 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500/50",
    },
    {
      key: "Sangat Tinggi",
      label: "S.Tinggi",
      count: mapTierCounts["Sangat Tinggi"],
      dotColor: "bg-[#ef4444]",
      activeClass:
        "border-rose-500 bg-rose-500/20 text-rose-950 dark:text-rose-200 ring-1 ring-rose-500/50",
    },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-sky-50/60 dark:bg-[#0b111e]">
      {/* TOP FLOATING OVERLAY BAR: Mode Toggle + Interactive Risk-Tier Filter Chips + Fullscreen Toggle */}
      <div className="pointer-events-none absolute left-14 right-4 top-3 z-[400] flex flex-wrap items-center justify-between gap-2">
        {/* Left Group: Layer Mode Switcher + Interactive Risk-Tier Filter Chips */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {/* Layer Mode Toggle: 514 Kab/Kota (/api/map-data) vs 38 Provinces */}
          <div
            role="group"
            aria-label="Map layer mode"
            className="inline-flex items-center rounded-xl border border-border/70 bg-background/90 dark:bg-slate-900/90 p-1 text-xs font-semibold shadow-lg backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setLayerMode("kabupaten")}
              aria-pressed={layerMode === "kabupaten"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                layerMode === "kabupaten"
                  ? "bg-foreground text-background shadow-sm dark:bg-slate-800 dark:text-teal-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="h-3.5 w-3.5 text-[#D9463E]" />
              <span>514 Kab/Kota</span>
            </button>
            <button
              type="button"
              onClick={() => setLayerMode("province")}
              aria-pressed={layerMode === "province"}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                layerMode === "province"
                  ? "bg-foreground text-background shadow-sm dark:bg-slate-800 dark:text-teal-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[#159A7C] dark:text-teal-400" />
              <span>38 Provinsi</span>
            </button>
          </div>

          {/* Interactive 4 Risk-Tier Count Filter Chips */}
          <div
            role="group"
            aria-label={
              locale === "id"
                ? "Filter peta berdasarkan tier risiko"
                : "Filter map by risk tier"
            }
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-background/90 dark:bg-slate-900/90 p-1 shadow-lg backdrop-blur-md"
          >
            {TIER_CHIPS.map((chip) => {
              const isActive = activeTierFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleToggleTier(chip.key)}
                  aria-pressed={isActive}
                  title={
                    locale === "id"
                      ? `Klik untuk filter wilayah tier ${chip.key} (${chip.count} Kab/Kota)`
                      : `Click to filter ${chip.key} tier (${chip.count} Districts)`
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? chip.activeClass
                      : "border-transparent bg-muted/40 text-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${chip.dotColor}`}
                  />
                  <span>{chip.label}</span>
                  <span className="font-mono font-bold opacity-90">
                    {chip.count}
                  </span>
                </button>
              );
            })}

            {activeTierFilter !== null && (
              <button
                type="button"
                onClick={() => setActiveTierFilter(null)}
                aria-label={
                  locale === "id"
                    ? "Reset filter tier risiko"
                    : "Reset risk tier filter"
                }
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Group: Fullscreen Toggle Button */}
        {onToggleFullscreen && (
          <div className="pointer-events-auto flex items-center">
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={
                isFullscreen
                  ? locale === "id"
                    ? "Keluar dari layar penuh"
                    : "Exit fullscreen map"
                  : locale === "id"
                  ? "Perbesar peta ke layar penuh"
                  : "Enter fullscreen map"
              }
              title={
                isFullscreen
                  ? locale === "id"
                    ? "Keluar Layar Penuh"
                    : "Exit Fullscreen"
                  : locale === "id"
                  ? "Layar Penuh"
                  : "Fullscreen"
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/90 dark:bg-slate-900/90 text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* INTERACTIVE FULL-BLEED LEAFLET MAP CANVAS */}
      <LeafletNationalCanvas
        provinces={provinces}
        mapData={mapData}
        provincesGeo={provincesGeo}
        allKabGeo={allKabGeo}
        layerMode={layerMode}
        hoveredProvinceId={hoveredProvinceId}
        selectedIslandGroup={selectedIslandGroup}
        activeTierFilter={activeTierFilter}
        flyToTarget={flyToTarget}
        onHoverProvince={onHoverProvince}
        onSelectProvince={(slug) => router.push(`/provinsi/${slug}`)}
        onSelectDistrict={(provSlug, domainId) =>
          router.push(`/provinsi/${provSlug}/${domainId}`)
        }
      />

      {/* BOTTOM-LEFT COLLAPSIBLE FLOATING LEGEND OVERLAY */}
      <div className="pointer-events-auto absolute bottom-28 left-3 z-[400] max-w-[calc(100vw-24px)] sm:bottom-5 sm:left-4 sm:w-[390px]">
        <MapLegend collapsible />
      </div>
    </div>
  );
}
