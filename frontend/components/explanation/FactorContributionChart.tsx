"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { BarChart3, Table2 } from "lucide-react";
import type { RiskFactor } from "@/lib/types";
import { getContributionColor, formatIndicatorValue } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface FactorContributionChartProps {
  factors: RiskFactor[];
}

export function FactorContributionChart({
  factors,
}: FactorContributionChartProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const { chartData, maxAbs } = useMemo(() => {
    const sorted = [...factors].sort(
      (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
    );
    const highest = sorted.reduce(
      (acc, item) => Math.max(acc, Math.abs(item.contribution)),
      1
    );
    const bound = Math.ceil((highest + 0.5) * 10) / 10;

    return {
      maxAbs: bound,
      chartData: sorted.map((f) => ({
        id: f.id,
        rawName: f.rawName ?? f.id,
        name: f.label[locale],
        contribution: f.contribution,
        valueText: formatIndicatorValue(
          f.value,
          f.unit,
          "Proxy / N/A",
          f.rawName ?? f.id
        ),
        natAvgText: formatIndicatorValue(
          f.nationalAvg,
          f.unit,
          "-",
          f.rawName ?? f.id
        ),
      })),
    };
  }, [factors, locale]);

  const chartHeight = Math.max(300, chartData.length * 42);

  return (
    <div className="relative flex h-full w-full flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      {/* Header + Accessible Toggle */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground sm:text-base">
            {t("shapTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("shapSubtitle")}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Chart or accessible table view"
          className="inline-flex shrink-0 items-center rounded-lg border border-border bg-muted/60 p-0.5 text-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "chart"}
            onClick={() => setViewMode("chart")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
              viewMode === "chart"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{t("viewChart")}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "table"}
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            <span>{t("viewTable")}</span>
          </button>
        </div>
      </div>

      {/* Legend Pills */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-300">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-600 dark:bg-rose-400" />
          {t("riskIncreasing")}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
          {t("protectiveFactor")}
        </span>
      </div>

      {viewMode === "chart" ? (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 10, bottom: 4 }}
            >
              <XAxis
                type="number"
                domain={[-maxAbs, maxAbs]}
                tickCount={7}
                tick={{
                  fontSize: 11,
                  fill: isDark ? "#94a3b8" : "#475569",
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={165}
                tick={{
                  fontSize: 11,
                  fill: isDark ? "#e2e8f0" : "#1e293b",
                }}
              />
              <Tooltip
                cursor={{
                  fill: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(15,23,42,0.05)",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const row = payload[0].payload as (typeof chartData)[number];
                  const isPos = row.contribution > 0;
                  return (
                    <div className="rounded-lg border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-md">
                      <p className="font-bold">{row.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {row.rawName}
                      </p>
                      <p className="mt-1 font-mono">
                        SHAP:{" "}
                        <span
                          className={
                            isPos
                              ? "font-bold text-rose-600 dark:text-rose-400"
                              : "font-bold text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {row.contribution > 0
                            ? `+${row.contribution.toFixed(2)}`
                            : row.contribution.toFixed(2)}
                        </span>
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Value: {row.valueText}
                      </p>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                x={0}
                stroke={isDark ? "#64748b" : "#334155"}
                strokeWidth={1.5}
              />
              <Bar dataKey="contribution" radius={[4, 4, 4, 4]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={getContributionColor(entry.contribution, isDark)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">
                  {t("colIndicator")}
                </th>
                <th className="px-3 py-2 font-semibold">{t("colRegion")}</th>
                <th className="px-3 py-2 font-semibold">SHAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {chartData.map((row) => (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-3 py-2 font-medium text-foreground">
                    <div>{row.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {row.rawName}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono">{row.valueText}</td>
                  <td className="px-3 py-2 font-mono font-bold">
                    <span
                      className={
                        row.contribution > 0
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-emerald-700 dark:text-emerald-300"
                      }
                    >
                      {row.contribution > 0
                        ? `+${row.contribution.toFixed(2)}`
                        : row.contribution.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
