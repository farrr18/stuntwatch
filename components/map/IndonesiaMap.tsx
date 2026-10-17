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
  RotateCw,
  X,
} from "lucide-react";
import type { Province } from "@/lib/types";
import {
  useMapData,
  useProvincesGeo,
  useAllKabKotaGeo,
} from "@/lib/hooks/useStuntingData";
import { useAppLocale } from "@/lib/i18n";
import { MapLegend } from "./MapLegend";
import type { RiskTierFilterValue } from "./LeafletNationalCanvas";

const LeafletNationalCanvas = dynamic(
  () => import("./LeafletNationalCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-sky-50/60 dark:bg-slate-900/70">
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
  hoveredDistrictId?: string | null;
  onHoverProvince: (id: string | null) => void;
  selectedIslandGroup: string;
  onSelectIslandGroup?: (group: string) => void;
  isDrawerCollapsed?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function IndonesiaMap({
  provinces,
  hoveredProvinceId,
  hoveredDistrictId = null,
  onHoverProvince,
  selectedIslandGroup,
  onSelectIslandGroup,
  isDrawerCollapsed = false,
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
  const [selectedRiskTierFilter, setSelectedRiskTierFilter] =
    useState<RiskTierFilterValue>("ALL");
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(0);

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

  const handleToggleRiskTier = (
    tier: Exclude<RiskTierFilterValue, "ALL">
  ) => {
    setSelectedRiskTierFilter((prev) => (prev === tier ? "ALL" : tier));
  };

  const handleResetView = () => {
    setSelectedRiskTierFilter("ALL");
    onSelectIslandGroup?.("ALL");
    setFitBoundsTrigger((n) => n + 1);
  };

  if (isLoadingMapData || isLoadingProvGeo || !mapData || !provincesGeo) {
    return (
      <div className="flex h-full min-h-[540px] w-full flex-col items-center justify-center bg-card p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Loading Leaflet Heatmap (`/api/map-data`)...
        </p>
      </div>
    );
  }

  const tierChips: Array<{
    tier: Exclude<RiskTierFilterValue, "ALL">;
    label: string;
    count: number;
    dotColor: string;
    activeClass: string;
    idleClass: string;
  }> = [
    {
      tier: "Rendah",
      label: locale === "id" ? "Rendah" : "Low",
      count: mapTierCounts.Rendah,
      dotColor: "bg-[#22c55e]",
      activeClass:
        "border-emerald-500 bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/50",
      idleClass:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-500/20",
    },
    {
      tier: "Sedang",
      label: locale === "id" ? "Sedang" : "Mod",
      count: mapTierCounts.Sedang,
      dotColor: "bg-[#eab308]",
      activeClass:
        "border-amber-500 bg-amber-500/20 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/50",
      idleClass:
        "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20",
    },
    {
      tier: "Tinggi",
      label: locale === "id" ? "Tinggi" : "High",
      count: mapTierCounts.Tinggi,
      dotColor: "bg-[#f97316]",
      activeClass:
        "border-orange-500 bg-orange-500/20 text-orange-950 dark:text-orange-200 ring-2 ring-orange-500/50",
      idleClass:
        "border-orange-500/30 bg-orange-500/10 text-orange-900 dark:text-orange-300 hover:bg-orange-500/20",
    },
    {
      tier: "Sangat Tinggi",
      label: locale === "id" ? "S.Tinggi" : "V.High",
      count: mapTierCounts["Sangat Tinggi"],
      dotColor: "bg-[#ef4444]",
      activeClass:
        "border-rose-500 bg-rose-500/20 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/50",
      idleClass:
        "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-300 hover:bg-rose-500/20",
    },
  ];

  // suppress unused icon lint
  void RotateCw;

  return (
    <div className="relative h-full w-full flex-1 overflow-hidden bg-sky-50/40 dark:bg-slate-950">
      {/* 1. TOP FLOATING OVERLAY BAR: Left = Mode Toggle + Fullscreen + Fit Bounds | Right = 4 Interactive Risk-Tier Filter Chips */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[400] flex flex-wrap items-start justify-between gap-2 sm:inset-x-4">
        {/* Top-Left Glassmorphic Controls Pill */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-background/85 p-1.5 shadow-lg backdrop-blur-md dark:bg-slate-900/85">
          {/* Layer Mode Toggle: 514 Kab/Kota (/api/map-data) vs 38 Provinces */}
          <div
            role="group"
            aria-label="Map layer mode"
            className="inline-flex items-center rounded-lg border border-border/60 bg-muted/60 p-0.5 text-[11px] font-semibold"
          >
            <button
              type="button"
              onClick={() => setLayerMode("kabupaten")}
              aria-pressed={layerMode === "kabupaten"}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                layerMode === "province"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3 w-3 text-[#159A7C]" />
              <span>38 Provinsi</span>
            </button>
          </div>

          {/* Fit All Indonesia Button */}
          <button
            type="button"
            onClick={handleResetView}
            title={
              locale === "id"
                ? "Tampilkan Seluruh Nusantara (Reset Peta)"
                : "Fit Full Indonesian Archipelago"
            }
            aria-label={
              locale === "id"
                ? "Tampilkan Seluruh Nusantara"
                : "Fit Full Indonesian Archipelago"
            }
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/60 bg-muted/60 px-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-3 w-3 text-[#159A7C]" />
            <span className="hidden sm:inline">
              {locale === "id" ? "Reset Peta" : "Fit Map"}
            </span>
          </button>

          {/* Fullscreen Toggle Button */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={
                isFullscreen
                  ? locale === "id"
                    ? "Keluar Layar Penuh"
                    : "Exit Fullscreen"
                  : locale === "id"
                  ? "Mode Layar Penuh"
                  : "Fullscreen Map"
              }
              aria-label={
                isFullscreen ? "Exit fullscreen map" : "Enter fullscreen map"
              }
              aria-pressed={isFullscreen}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Top-Right / Top-Center Interactive Risk-Tier Filter Chips */}
        <div
          role="group"
          aria-label="Filter map regions by stunting risk tier"
          className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-background/85 p-1.5 shadow-lg backdrop-blur-md dark:bg-slate-900/85"
        >
          {tierChips.map((chip) => {
            const isActive = selectedRiskTierFilter === chip.tier;
            return (
              <button
                key={chip.tier}
                type="button"
                onClick={() => handleToggleRiskTier(chip.tier)}
                aria-pressed={isActive}
                title={
                  locale === "id"
                    ? `Filter wilayah kategori ${chip.tier} (${chip.count} Kab/Kota)`
                    : `Filter ${chip.tier} risk tier (${chip.count} districts)`
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive ? chip.activeClass : chip.idleClass
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${chip.dotColor}`} />
                <span>{chip.label}</span>
                <span className="font-mono font-extrabold">{chip.count}</span>
              </button>
            );
          })}

          {selectedRiskTierFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedRiskTierFilter("ALL")}
              aria-label="Reset risk tier filter"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-bold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3 w-3 text-[#D9463E]" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. INTERACTIVE LEAFLET CHOROPLETH MAP CANVAS (100% Width & Height) */}
      <LeafletNationalCanvas
        provinces={provinces}
        mapData={mapData}
        provincesGeo={provincesGeo}
        allKabGeo={allKabGeo}
        layerMode={layerMode}
        hoveredProvinceId={hoveredProvinceId}
        hoveredDistrictId={hoveredDistrictId}
        selectedIslandGroup={selectedIslandGroup}
        selectedRiskTierFilter={selectedRiskTierFilter}
        fitBoundsTrigger={fitBoundsTrigger}
        isDrawerCollapsed={isDrawerCollapsed}
        onHoverProvince={onHoverProvince}
        onSelectProvince={(slug) => router.push(`/provinsi/${slug}`)}
        onSelectDistrict={(provSlug, domainId) =>
          router.push(`/provinsi/${provSlug}/${domainId}`)
        }
      />

      {/* 3. BOTTOM-LEFT FLOATING COLLAPSIBLE LEGEND OVERLAY */}
      <div className="pointer-events-auto absolute bottom-28 left-3 z-[400] sm:left-4 lg:bottom-5">
        <MapLegend collapsible />
      </div>
    </div>
  );
}
