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
      ? "Data Confidence: Proxy Provinsi — Indikator lokal SUSENAS/WASH di kabupaten ini belum lengkap, sehingga model menggunakan nilai rata-rata provinsi sebagai proxy."
      : "Data Confidence: Province Proxy — Local district SUSENAS/WASH indicators are missing, so the model falls back to provincial proxy averages.";

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
      className={`group flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isSelected
          ? `${band.borderClass} bg-accent/70 shadow-sm ring-1 ring-current/20`
          : isHovered
          ? "border-foreground/40 bg-muted/70"
          : "border-border/80 bg-background hover:bg-muted/40"
      }`}
    >
      {/* Top Row: Rank + Name + Proxy Confidence Badge + Actual & Proxy Prediction Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={`inline-flex h-6 min-w-[28px] shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
              isSelected
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            #{rankIndex}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-bold text-foreground">
                {item.name}
              </span>
              <span className="inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                ID {item.domain_id}
              </span>
              {isProxy && (
                <span
                  title={proxyTooltipText}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300"
                >
                  <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    {locale === "id" ? "⚠️ Proxy Provinsi" : "⚠️ Province Proxy"}
                  </span>
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              Top Feature:{" "}
              <span className="font-medium text-foreground">
                {item.topDriverLabel[locale]}
              </span>{" "}
              <span className="font-mono font-bold text-[#D9463E]">
                (+{item.top_feature_shap.toFixed(2)} SHAP)
              </span>
            </p>
          </div>
        </div>

        {/* Right Metrics: Actual SSGI % + Predicted Risk (Province Proxy) % */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold ${band.badgeClass}`}
          >
            <span className="font-mono">Aktual {item.actual}%</span>
            <span className="text-[10px] font-semibold opacity-90">
              · {item.actual_tier || levelLabel}
            </span>
          </span>
          <span
            title={isProxy ? proxyTooltipText : undefined}
            className="font-mono text-[10px] text-muted-foreground"
          >
            {locale === "id"
              ? "Prediksi Risiko (Provinsi Proxy):"
              : "Predicted Risk (Province Proxy):"}{" "}
            <strong className="text-foreground">{item.prediction}%</strong> (
            {item.risk_tier})
          </span>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${band.barClass}`}
            style={{ width: `${Math.min(100, item.actual * 2)}%` }}
          />
        </div>
      </div>
    </button>
  );
}
