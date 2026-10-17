"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import {
  useProvinces,
  useProvinceSummary,
  useKabKota,
} from "@/lib/hooks/useStuntingData";
import { resolveProvinceSlug } from "@/lib/api/mockAdapter";
import { useAppLocale } from "@/lib/i18n";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProvinceMap } from "@/components/map/ProvinceMap";
import { KabKotaRankList } from "@/components/ranking/KabKotaRankList";
import { ExplanationPanel } from "@/components/explanation/ExplanationPanel";

interface ProvinceDashboardViewProps {
  provinceId: string;
  initialKabKotaId?: string;
}

export function ProvinceDashboardView({
  provinceId,
  initialKabKotaId,
}: ProvinceDashboardViewProps) {
  const router = useRouter();
  const { locale } = useAppLocale();
  const slug = resolveProvinceSlug(provinceId);

  const { data: provinces } = useProvinces();
  // Live Endpoint 3: GET /api/provinsi/{provinceSlug}/summary
  const { data: summary } = useProvinceSummary(slug);
  // Live Endpoint 4: GET /api/provinsi/{provinceSlug}
  const { data: kabKotaList, isLoading } = useKabKota(slug);

  const [hoveredKabKotaId, setHoveredKabKotaId] = useState<string | null>(null);

  const province = useMemo(
    () =>
      provinces?.find(
        (p) => p.slug === slug || p.id === provinceId
      ),
    [provinces, slug, provinceId]
  );

  // Determine active KabKota (either deep-linked or highest actual risk rank #1 by default)
  const activeKabKota = useMemo(() => {
    if (!kabKotaList || kabKotaList.length === 0) return null;
    if (initialKabKotaId) {
      const found = kabKotaList.find(
        (k) => k.id === String(initialKabKotaId) || String(k.domain_id) === String(initialKabKotaId)
      );
      if (found) return found;
    }
    return kabKotaList[0];
  }, [kabKotaList, initialKabKotaId]);

  const handleSelectKabKota = (nextKabKotaId: string) => {
    router.push(`/provinsi/${slug}/${nextKabKotaId}`, { scroll: false });
  };

  if (isLoading || !kabKotaList || !activeKabKota) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-border bg-card p-6">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Loading Province Live Summary & Districts...
          </p>
        </div>
      </main>
    );
  }

  const provinceName =
    summary?.province ?? province?.name ?? activeKabKota.provinceName;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Row 1: Breadcrumb Bar (12 Cols) */}
      <Breadcrumb
        provinceId={slug}
        provinceName={provinceName}
        kabKotaName={activeKabKota.name}
      />

      {/* Row 2: Provincial KPI Header Cards (`GET /api/provinsi/{provinceSlug}/summary`) */}
      {summary && (
        <section
          aria-label="Provincial KPI Summary"
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* KPI 1: Avg Predicted (Province Proxy) & Avg Actual SSGI */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>
                {locale === "id"
                  ? "Prediksi Risiko (Provinsi Proxy) vs Aktual"
                  : "Predicted Risk (Province Proxy) vs Actual"}
              </span>
              <Activity className="h-4 w-4 text-[#D9463E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-extrabold text-foreground">
                {summary.avg_predicted}%
              </span>
              <span className="font-mono text-xs font-semibold text-muted-foreground">
                (Aktual SSGI: {summary.avg_actual}%)
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              Range: {summary.min_predicted}% – {summary.max_predicted}% · MAE{" "}
              {summary.mae_in_province}
            </p>
          </div>

          {/* KPI 2: Tier Counts Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>
                {locale === "id"
                  ? `Distribusi Tier (${summary.n_kabupaten} Kab/Kota)`
                  : `Tier Distribution (${summary.n_kabupaten} Districts)`}
              </span>
              <BarChart3 className="h-4 w-4 text-[#159A7C] dark:text-[#2DD4BF]" />
            </div>
            <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
              <div className="rounded-lg bg-rose-500/15 px-1.5 py-1 text-rose-700 dark:text-rose-300">
                <div className="text-sm font-extrabold">
                  {summary.tier_counts["Sangat Tinggi"] ?? 0}
                </div>
                <div className="text-[9px] font-sans">S.Tinggi</div>
              </div>
              <div className="rounded-lg bg-orange-500/15 px-1.5 py-1 text-orange-700 dark:text-orange-300">
                <div className="text-sm font-extrabold">
                  {summary.tier_counts.Tinggi ?? 0}
                </div>
                <div className="text-[9px] font-sans">Tinggi</div>
              </div>
              <div className="rounded-lg bg-amber-500/15 px-1.5 py-1 text-amber-700 dark:text-amber-300">
                <div className="text-sm font-extrabold">
                  {summary.tier_counts.Sedang ?? 0}
                </div>
                <div className="text-[9px] font-sans">Sedang</div>
              </div>
              <div className="rounded-lg bg-emerald-500/15 px-1.5 py-1 text-emerald-700 dark:text-emerald-300">
                <div className="text-sm font-extrabold">
                  {summary.tier_counts.Rendah ?? 0}
                </div>
                <div className="text-[9px] font-sans">Rendah</div>
              </div>
            </div>
          </div>

          {/* KPI 3: Highest Risk District */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>
                {locale === "id"
                  ? "Kab/Kota Risiko Tertinggi"
                  : "Highest Risk District"}
              </span>
              <AlertOctagon className="h-4 w-4 text-[#D9463E]" />
            </div>
            <p className="mt-2 truncate text-lg font-extrabold text-foreground">
              {summary.highest_risk}
            </p>
            <p className="mt-1 font-mono text-xs text-[#D9463E] font-semibold">
              Max Predicted: {summary.max_predicted}%
            </p>
          </div>

          {/* KPI 4: Lowest Risk District */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>
                {locale === "id"
                  ? "Kab/Kota Risiko Terendah"
                  : "Lowest Risk District"}
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 truncate text-lg font-extrabold text-foreground">
              {summary.lowest_risk}
            </p>
            <p className="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Min Predicted: {summary.min_predicted}%
            </p>
          </div>
        </section>
      )}

      {/* Row 3: Split Map (7 Cols Desktop) + Ranked List (5 Cols Desktop) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProvinceMap
            provinceId={slug}
            provinceName={provinceName}
            kabKotaList={kabKotaList}
            selectedKabKotaId={activeKabKota.id}
            hoveredKabKotaId={hoveredKabKotaId}
            onSelectKabKota={handleSelectKabKota}
            onHoverKabKota={setHoveredKabKotaId}
          />
        </div>
        <div className="lg:col-span-5">
          <KabKotaRankList
            items={kabKotaList}
            selectedKabKotaId={activeKabKota.id}
            hoveredKabKotaId={hoveredKabKotaId}
            onSelectKabKota={handleSelectKabKota}
            onHoverKabKota={setHoveredKabKotaId}
          />
        </div>
      </div>

      {/* Row 4: Full 12-Col District Detail & AI Policy Brief ExplanationPanel */}
      <ExplanationPanel kabKotaId={activeKabKota.id} />
    </main>
  );
}
