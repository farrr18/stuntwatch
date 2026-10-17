"use client";

import React, { useMemo, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { KabKota } from "@/lib/types";
import { useKabKotaGeo } from "@/lib/hooks/useStuntingData";
import { createFittedPathGenerator } from "@/lib/geo";
import { getMapFillColor, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";
import { MapTooltip, type TooltipInfo } from "./MapTooltip";
import { MapLegend } from "./MapLegend";

interface ProvinceMapProps {
  provinceId: string;
  provinceName: string;
  kabKotaList: KabKota[];
  selectedKabKotaId: string;
  hoveredKabKotaId: string | null;
  onSelectKabKota: (kabKotaId: string) => void;
  onHoverKabKota: (kabKotaId: string | null) => void;
}

const SVG_WIDTH = 680;
const SVG_HEIGHT = 440;

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
  const { locale } = useAppLocale();
  const { data: geoData, isLoading } = useKabKotaGeo(provinceId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const kabMap = useMemo(() => {
    const map = new Map<string, KabKota>();
    kabKotaList.forEach((k) => map.set(k.id, k));
    return map;
  }, [kabKotaList]);

  const { pathGenerator } = useMemo(() => {
    if (!geoData) return { pathGenerator: null };
    return createFittedPathGenerator(geoData, SVG_WIDTH, SVG_HEIGHT, 28);
  }, [geoData]);

  if (isLoading || !geoData || !pathGenerator) {
    return (
      <div className="flex h-[480px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-rose-600" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Loading {provinceName} District Boundaries...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
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

      {/* SVG Canvas */}
      <div className="relative aspect-[16/10.5] w-full overflow-hidden rounded-xl border border-border/60 bg-sky-50/50 dark:bg-slate-900/70">
        <MapTooltip info={tooltip} />

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full select-none"
          role="img"
          aria-label={t("mapTitle", { province: provinceName })}
        >
          <g>
            {geoData.features.map((feat) => {
              const kabId = String(feat.id ?? feat.properties?.id ?? "");
              const kab = kabMap.get(kabId);
              if (!kab) return null;

              const d = pathGenerator(feat) ?? "";
              const centroid = pathGenerator.centroid(feat);
              const isSelected = selectedKabKotaId === kab.id;
              const isHovered = hoveredKabKotaId === kab.id;
              const isActive = isSelected || isHovered;

              const fillColor = getMapFillColor(kab.riskIndex);
              const riskLabel = getRiskLabel(kab.riskLevel, locale);

              const updateTooltip = (clientX: number, clientY: number) => {
                const rect = containerRef.current?.getBoundingClientRect();
                const relX = rect ? clientX - rect.left : SVG_WIDTH / 2;
                const relY = rect ? clientY - rect.top : SVG_HEIGHT / 2;
                setTooltip({
                  x: relX,
                  y: relY,
                  name: kab.name,
                  subtitle: kab.type,
                  riskIndex: kab.riskIndex,
                  riskLevel: kab.riskLevel,
                  rankText: `Rank #${kab.provinceRank}/${kab.totalInProvince}`,
                  extraLabel: t("topDriver"),
                  extraValue: kab.topDriverLabel[locale],
                });
              };

              return (
                <g key={kab.id}>
                  <path
                    d={d}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`${kab.name}, risk index ${kab.riskIndex}, ${riskLabel}, rank ${kab.provinceRank} of ${kab.totalInProvince}`}
                    fill={fillColor}
                    fillOpacity={isActive ? 1 : 0.84}
                    stroke={
                      isSelected
                        ? "#0f172a"
                        : isHovered
                        ? "#1e293b"
                        : "rgba(15, 23, 42, 0.5)"
                    }
                    strokeWidth={isSelected ? 3.2 : isHovered ? 2.4 : 1.1}
                    className="cursor-pointer transition-all duration-150 focus:outline-none"
                    onMouseEnter={(e) => {
                      onHoverKabKota(kab.id);
                      updateTooltip(e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => updateTooltip(e.clientX, e.clientY)}
                    onMouseLeave={() => {
                      onHoverKabKota(null);
                      setTooltip(null);
                    }}
                    onFocus={() => {
                      onHoverKabKota(kab.id);
                      setTooltip({
                        x: Number.isFinite(centroid[0])
                          ? (centroid[0] / SVG_WIDTH) * 480
                          : 240,
                        y: Number.isFinite(centroid[1])
                          ? (centroid[1] / SVG_HEIGHT) * 300
                          : 160,
                        name: kab.name,
                        subtitle: kab.type,
                        riskIndex: kab.riskIndex,
                        riskLevel: kab.riskLevel,
                        rankText: `Rank #${kab.provinceRank}/${kab.totalInProvince}`,
                        extraLabel: t("topDriver"),
                        extraValue: kab.topDriverLabel[locale],
                      });
                    }}
                    onBlur={() => {
                      onHoverKabKota(null);
                      setTooltip(null);
                    }}
                    onClick={() => onSelectKabKota(kab.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectKabKota(kab.id);
                      }
                    }}
                  />

                  {/* District Rank & Score Label */}
                  {Number.isFinite(centroid[0]) &&
                    Number.isFinite(centroid[1]) && (
                      <g
                        className="pointer-events-none"
                        transform={`translate(${centroid[0]}, ${centroid[1]})`}
                      >
                        <rect
                          x={isSelected ? -20 : -15}
                          y={isSelected ? -11 : -9}
                          width={isSelected ? 40 : 30}
                          height={isSelected ? 22 : 18}
                          rx={5}
                          className={
                            isSelected
                              ? "fill-slate-950 stroke-amber-300"
                              : "fill-slate-950/75 stroke-white/70"
                          }
                          strokeWidth={isSelected ? 1.8 : 0.9}
                        />
                        <text
                          textAnchor="middle"
                          dy="0.35em"
                          className="fill-white font-mono text-[9px] font-bold"
                        >
                          #{kab.provinceRank}·{kab.riskIndex}
                        </text>
                      </g>
                    )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Bottom Legend */}
      <div className="mt-3">
        <MapLegend />
      </div>
    </motion.div>
  );
}
