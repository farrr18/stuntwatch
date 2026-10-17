"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import type { KabKota } from "@/lib/types";
import { useKabKotaGeo, useMapData } from "@/lib/hooks/useStuntingData";
import { MapLegend } from "./MapLegend";

const LeafletProvinceCanvas = dynamic(
  () => import("./LeafletProvinceCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[460px] sm:h-[520px] w-full flex-col items-center justify-center rounded-xl bg-sky-50/50 dark:bg-[#0b111e]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-teal-500" />
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          Initializing Provincial Leaflet Map...
        </p>
      </div>
    ),
  }
);

interface ProvinceMapProps {
  provinceId: string;
  provinceName: string;
  kabKotaList: KabKota[];
  selectedKabKotaId: string;
  hoveredKabKotaId: string | null;
  onSelectKabKota: (kabKotaId: string) => void;
  onHoverKabKota: (kabKotaId: string | null) => void;
}

export function ProvinceMap({
  provinceId,
  provinceName,
  kabKotaList,
  selectedKabKotaId,
  hoveredKabKotaId,
  onSelectKabKota,
  onHoverKabKota,
}: ProvinceMapProps) {
  const t = useTranslations("province");
  const { data: geoData, isLoading } = useKabKotaGeo(provinceId);
  const { data: mapData } = useMapData();

  if (isLoading || !geoData) {
    return (
      <div className="flex h-[520px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 shadow-sm">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-teal-500" />
        <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading {provinceName} District Boundaries...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 shadow-sm">
      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
            {t("mapTitle", { province: provinceName })}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t("mapSubtitle")}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#232b3e] bg-slate-50 dark:bg-[#182030] px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <Globe className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>EPSG: 4326</span>
        </span>
      </div>

      {/* Full-Width Interactive Zoomed Leaflet Canvas + Floating Legend */}
      <div className="relative mt-4 h-[460px] sm:h-[520px] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-[#232b3e] bg-sky-50/50 dark:bg-[#0b111e] isolate">
        <LeafletProvinceCanvas
          provinceId={provinceId}
          geoData={geoData}
          kabKotaList={kabKotaList}
          mapData={mapData}
          selectedKabKotaId={selectedKabKotaId}
          hoveredKabKotaId={hoveredKabKotaId}
          onSelectKabKota={onSelectKabKota}
          onHoverKabKota={onHoverKabKota}
        />

        {/* Floating Bottom-Left Legend Card Inside Map Frame */}
        <div className="pointer-events-auto absolute bottom-4 left-4 z-[400] max-w-[calc(100%-32px)] sm:w-[390px]">
          <MapLegend collapsible />
        </div>
      </div>
    </div>
  );
}
