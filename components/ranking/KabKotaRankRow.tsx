"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { KabKota } from "@/lib/types";
import { getRiskBandConfig, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface KabKotaRankRowProps {
  item: KabKota;
  rankIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function KabKotaRankRow({
  item,
  rankIndex,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: KabKotaRankRowProps) {
  const { locale } = useAppLocale();
  const band = getRiskBandConfig(item.riskLevel);
  const levelLabel = getRiskLabel(item.riskLevel, locale);

  const isProxy =
    item.data_confidence === "proxy" ||
    Boolean(item.top_feature?.endsWith("_prov_pct"));

  const proxyTooltipText =
    locale === "id"
      ? "Data Confidence: Proxy Provinsi — Indikator lokal SUSENAS/WASH di kabupaten/kota ini belum lengkap, sehingga model menggunakan nilai rata-rata provinsi sebagai proxy."
      : "Data Confidence: Province Proxy — Local district SUSENAS/WASH indicators are incomplete, so the model falls back to provincial proxy averages.";

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(item.id)}
      onBlur={() => onHover(null)}
      aria-pressed={isSelected}
      aria-label={`Rank ${rankIndex}, ${item.name}, actual SSGI ${item.actual}%, predicted risk (province proxy) ${item.prediction}%, top SHAP +${item.top_feature_shap}, ${levelLabel}`}
      className={`group flex h-full w-full flex-col justify-between gap-2.5 rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        isSelected
          ? "border-teal-500/70 bg-teal-50/70 dark:bg-[#182030] shadow-md ring-1 ring-teal-500/40"
          : isHovered
          ? "border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-[#182030]/75"
          : "border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#0d121d] hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* Top Row: Rank + Name + ID + Actual % Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`inline-flex h-6 min-w-[28px] shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
              isSelected
                ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            #{rankIndex}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {item.name}
              </span>
              <span className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
                ID {item.domain_id}
              </span>
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${band.badgeClass}`}
        >
          <span className="font-mono">Aktual {item.actual}%</span>
        </span>
      </div>

      {/* Middle Row: Tier Badge + Proxy Prediction */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <span
          title={isProxy ? proxyTooltipText : undefined}
          className="inline-flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300"
        >
          {isProxy && (
            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
          )}
          <span>
            {locale === "id"
              ? "⚠️ Prediksi Risiko (Proxy):"
              : "⚠️ Predicted Risk (Proxy):"}{" "}
            <strong className="text-slate-900 dark:text-white">
              {item.prediction}%
            </strong>
          </span>
        </span>

        <span className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
          {item.actual_tier || levelLabel}
        </span>
      </div>

      {/* Score Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${band.barClass}`}
          style={{ width: `${Math.min(100, item.actual * 2)}%` }}
        />
      </div>

      {/* Bottom Row: Top Feature + SHAP */}
      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
        Top Feature:{" "}
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {item.topDriverLabel[locale]}
        </span>{" "}
        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
          (+{item.top_feature_shap.toFixed(2)} SHAP)
        </span>
      </p>
    </button>
  );
}
