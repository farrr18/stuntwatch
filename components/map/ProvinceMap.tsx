"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { KabKota } from "@/lib/types";
import { useKabKotaGeo, useMapData } from "@/lib/hooks/useStuntingData";
import { MapLegend } from "./MapLegend";

const LeafletProvinceCanvas = dynamic(
  () => import("./LeafletProvinceCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[430px] w-full flex-col items-center justify-center rounded-xl bg-sky-50/50 dark:bg-slate-900/70">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
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
      <div className="flex h-[520px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Loading {provinceName} District Boundaries...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      {/* Card Header */}
      <div className="mb-3">
        <h2 className="text-base font-bold text-foreground sm:text-lg">
          {t("mapTitle", { province: provinceName })}
        </h2>
        <p className="text-xs text-muted-foreground">{t("mapSubtitle")}</p>
      </div>

      {/* Interactive Zoomed Leaflet Canvas */}
      <div className="relative h-[430px] w-full overflow-hidden rounded-xl border border-border/60 bg-sky-50/50 dark:bg-slate-900/70">
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
      </div>

      {/* Bottom Legend */}
      <div className="mt-3">
        <MapLegend />
      </div>
    </motion.div>
  );
}
