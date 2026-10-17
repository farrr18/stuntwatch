"use client";

import React, { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ZoomIn, RotateCcw } from "lucide-react";
import type { Province } from "@/lib/types";
import { useProvincesGeo } from "@/lib/hooks/useStuntingData";
import { createFittedPathGenerator } from "@/lib/geo";
import { getMapFillColor, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";
import { MapTooltip, type TooltipInfo } from "./MapTooltip";
import { MapLegend } from "./MapLegend";

interface IndonesiaMapProps {
  provinces: Province[];
  hoveredProvinceId: string | null;
  onHoverProvince: (id: string | null) => void;
  selectedIslandGroup: string;
}

const SVG_WIDTH = 960;
const SVG_HEIGHT = 460;

export function IndonesiaMap({
  provinces,
  hoveredProvinceId,
  onHoverProvince,
  selectedIslandGroup,
}: IndonesiaMapProps) {
  const router = useRouter();
  const t = useTranslations("national");
  const { locale } = useAppLocale();
  const { data: geoData, isLoading } = useProvincesGeo();
  const containerRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [zoomingProvinceId, setZoomingProvinceId] = useState<string | null>(
    null
  );

  const provinceMap = useMemo(() => {
    const map = new Map<string, Province>();
    provinces.forEach((p) => map.set(p.id, p));
    return map;
  }, [provinces]);

  const { pathGenerator } = useMemo(() => {
    if (!geoData) {
      return { pathGenerator: null };
    }
    return createFittedPathGenerator(geoData, SVG_WIDTH, SVG_HEIGHT, 24);
  }, [geoData]);

  const handleSelectProvince = (provinceId: string) => {
    setZoomingProvinceId(provinceId);
    router.push(`/provinsi/${provinceId}`);
  };

  if (isLoading || !geoData || !pathGenerator) {
    return (
      <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-rose-600" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Loading Indonesia 38-Province Choropleth...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      {/* Map Controls Overlay */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{t("clickToDrillDown")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.min(2.2, +(z + 0.3).toFixed(1)))}
            aria-label="Zoom in map"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomScale(1)}
            aria-label="Reset map zoom"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive SVG Map Canvas */}
      <div className="relative aspect-[16/8.2] w-full overflow-hidden rounded-xl bg-sky-50/60 dark:bg-slate-900/70 border border-border/50">
        <MapTooltip info={tooltip} />

        <motion.svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full select-none"
          role="img"
          aria-label={t("title")}
          animate={{
            scale: zoomingProvinceId ? 1.65 : zoomScale,
            opacity: zoomingProvinceId ? 0.45 : 1,
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {/* Subtle archipelago graticule/equator reference line */}
          <line
            x1={0}
            y1={SVG_HEIGHT * 0.34}
            x2={SVG_WIDTH}
            y2={SVG_HEIGHT * 0.34}
            stroke="currentColor"
            strokeDasharray="4 6"
            className="text-slate-300 dark:text-slate-700/70"
            strokeWidth={0.8}
          />
          <text
            x={14}
            y={SVG_HEIGHT * 0.34 - 5}
            className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono"
          >
            0° Equator (Khatulistiwa)
          </text>

          <g>
            {geoData.features.map((feat) => {
              const provId = String(feat.id ?? feat.properties?.id ?? "");
              const prov = provinceMap.get(provId);
              if (!prov) return null;

              const d = pathGenerator(feat) ?? "";
              const centroid = pathGenerator.centroid(feat);
              const isHovered = hoveredProvinceId === prov.id;
              const isFilteredOut =
                selectedIslandGroup !== "ALL" &&
                prov.islandGroup !== selectedIslandGroup;

              const fillColor = getMapFillColor(prov.riskIndex);
              const riskLabel = getRiskLabel(prov.riskLevel, locale);

              const updateTooltipFromEvent = (
                clientX: number,
                clientY: number
              ) => {
                const rect = containerRef.current?.getBoundingClientRect();
                const relX = rect ? clientX - rect.left : SVG_WIDTH / 2;
                const relY = rect ? clientY - rect.top : SVG_HEIGHT / 2;
                setTooltip({
                  x: relX,
                  y: relY,
                  name: prov.name,
                  subtitle: prov.islandGroup,
                  riskIndex: prov.riskIndex,
                  riskLevel: prov.riskLevel,
                  rankText: `${t("nationalRank")} #${prov.nationalRank}/38`,
                  extraLabel: t("highRiskDistricts"),
                  extraValue: `${prov.highRiskKabKotaCount}/${prov.totalKabKota} Kab/Kota`,
                });
              };

              return (
                <g key={prov.id}>
                  <path
                    d={d}
                    tabIndex={0}
                    role="button"
                    aria-label={`${prov.name}, ${t("riskIndex")} ${
                      prov.riskIndex
                    }, ${riskLabel}, ${t("nationalRank")} #${
                      prov.nationalRank
                    }`}
                    fill={fillColor}
                    fillOpacity={isFilteredOut ? 0.2 : isHovered ? 1 : 0.88}
                    stroke={
                      isHovered
                        ? "#0f172a"
                        : "rgba(15, 23, 42, 0.55)"
                    }
                    strokeWidth={isHovered ? 2.5 : 1.1}
                    className="cursor-pointer transition-all duration-150 focus:outline-none"
                    onMouseEnter={(e) => {
                      onHoverProvince(prov.id);
                      updateTooltipFromEvent(e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => {
                      updateTooltipFromEvent(e.clientX, e.clientY);
                    }}
                    onMouseLeave={() => {
                      onHoverProvince(null);
                      setTooltip(null);
                    }}
                    onFocus={() => {
                      onHoverProvince(prov.id);
                      setTooltip({
                        x: Number.isFinite(centroid[0])
                          ? (centroid[0] / SVG_WIDTH) * 600
                          : 260,
                        y: Number.isFinite(centroid[1])
                          ? (centroid[1] / SVG_HEIGHT) * 320
                          : 160,
                        name: prov.name,
                        subtitle: prov.islandGroup,
                        riskIndex: prov.riskIndex,
                        riskLevel: prov.riskLevel,
                        rankText: `${t("nationalRank")} #${prov.nationalRank}/38`,
                        extraLabel: t("highRiskDistricts"),
                        extraValue: `${prov.highRiskKabKotaCount}/${prov.totalKabKota} Kab/Kota`,
                      });
                    }}
                    onBlur={() => {
                      onHoverProvince(null);
                      setTooltip(null);
                    }}
                    onClick={() => handleSelectProvince(prov.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectProvince(prov.id);
                      }
                    }}
                  />
                  {/* Province Score Pill / Label at Polygon Centroid */}
                  {Number.isFinite(centroid[0]) &&
                    Number.isFinite(centroid[1]) &&
                    !isFilteredOut && (
                      <g
                        className="pointer-events-none"
                        transform={`translate(${centroid[0]}, ${centroid[1]})`}
                      >
                        <circle
                          r={isHovered ? 10 : 7.5}
                          className="fill-slate-950/75 dark:fill-slate-950/85 stroke-white/80"
                          strokeWidth={1}
                        />
                        <text
                          textAnchor="middle"
                          dy="0.35em"
                          className="fill-white font-mono text-[8px] font-bold"
                        >
                          {prov.riskIndex}
                        </text>
                      </g>
                    )}
                </g>
              );
            })}
          </g>
        </motion.svg>
      </div>

      {/* Bottom-Docked MapLegend */}
      <div className="mt-3">
        <MapLegend />
      </div>
    </div>
  );
}
