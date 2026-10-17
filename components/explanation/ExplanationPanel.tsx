"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  useExplanation,
  useDistrictNarrative,
} from "@/lib/hooks/useStuntingData";
import { getRiskBandConfig, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";
import { SummaryCard } from "./SummaryCard";
import { FactorContributionChart } from "./FactorContributionChart";
import { ComparisonTable } from "./ComparisonTable";
import { FactorCard } from "./FactorCard";
import { RecommendationList } from "./RecommendationList";
import { MethodologyNote } from "./MethodologyNote";

export type ProvinceAccordionKey =
  | "peringkat"
  | "shap_ai"
  | "rekomendasi"
  | "matriks"
  | "kamus"
  | "metodologi";

interface ExplanationPanelProps {
  kabKotaId: string;
  maeInProvince?: number;
  openSections: Record<ProvinceAccordionKey, boolean>;
  onToggleSection: (key: ProvinceAccordionKey) => void;
}

export function ExplanationPanel({
  kabKotaId,
  maeInProvince = 6.33,
  openSections,
  onToggleSection,
}: ExplanationPanelProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();

  // Live Endpoint 5: GET /api/kabupaten/{kabKotaId} (Immediate SHAP & District Features)
  const { data, isLoading } = useExplanation(kabKotaId);

  // Live Endpoint 6: GET /api/kabupaten/{kabKotaId}/narrative (Non-blocking Together AI Policy Brief)
  const { data: narrativeData, isLoading: isLoadingNarrative } =
    useDistrictNarrative(kabKotaId);

  if (isLoading || !data) {
    return (
      <section
        aria-busy="true"
        className="mt-4 rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading District SHAP Features (`/api/kabupaten/{kabKotaId}`)...
          </p>
        </div>
      </section>
    );
  }

  const band = getRiskBandConfig(data.riskLevel);
  const riskLabel = getRiskLabel(data.riskLevel, locale);

  const activeSummary = narrativeData?.summary ?? data.summary;
  const activeRecommendations =
    narrativeData?.recommendations ?? data.recommendations;

  // Compute top 2 risk drivers for Section 2 dynamic subtitle
  const sortedPositiveDrivers = [...data.factors]
    .filter((f) => f.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution);

  const topDriver1 = sortedPositiveDrivers[0] ?? data.factors[0];
  const topDriver2 = sortedPositiveDrivers[1] ?? data.factors[1];

  const section2Subtitle =
    locale === "id"
      ? `Pendorong risiko utama (${data.name}): ${
          topDriver1 ? `${topDriver1.label.id} (+${topDriver1.contribution.toFixed(2)} pts)` : "-"
        }${
          topDriver2
            ? ` dan ${topDriver2.label.id} (+${topDriver2.contribution.toFixed(2)} pts).`
            : "."
        }`
      : `Primary risk drivers (${data.name}): ${
          topDriver1 ? `${topDriver1.label.en} (+${topDriver1.contribution.toFixed(2)} pts)` : "-"
        }${
          topDriver2
            ? ` and ${topDriver2.label.en} (+${topDriver2.contribution.toFixed(2)} pts).`
            : "."
        }`;

  const topGapFactor = topDriver1;
  const topGapBadgeText = topGapFactor
    ? `${topGapFactor.label[locale]} (${
        topGapFactor.value !== null && topGapFactor.value !== undefined
          ? topGapFactor.value
          : "Proxy"
      } vs ${topGapFactor.nationalAvg}${topGapFactor.unit})`
    : locale === "id"
    ? "Daya Beli Tertekan"
    : "Purchasing Power Gap";

  const primaryFactors = data.factors.slice(0, 3);
  const secondaryFactors = data.factors.slice(3, 8);

  const renderToggleButton = (key: ProvinceAccordionKey, labelTitle: string) => {
    const isOpen = openSections[key];
    return (
      <button
        type="button"
        onClick={() => onToggleSection(key)}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Sembunyikan" : "Lihat Detail"} ${labelTitle}`}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
          isOpen
            ? "border-teal-500/50 bg-teal-500/15 text-teal-800 dark:text-teal-300"
            : "border-slate-200 dark:border-[#232b3e] bg-slate-50 dark:bg-[#182030] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        <span>
          {isOpen
            ? locale === "id"
              ? "Sembunyikan"
              : "Hide Detail"
            : locale === "id"
            ? "Lihat Detail"
            : "More Information"}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
    );
  };

  return (
    <div
      aria-label={`Analytical sections for ${data.name}`}
      className="flex w-full flex-col gap-4"
    >
      {/* ===================================================================== */}
      {/* SECTION 2: Faktor Risiko Stunting (SHAP) & Ringkasan Eksekutif Wilayah */}
      {/* ===================================================================== */}
      <section
        id="faktor-shap"
        className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 text-slate-800 dark:text-slate-100 shadow-sm"
      >
        <span id="ringkasan-ai" className="sr-only" />
        {/* Permanent Summary Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {locale === "id"
                  ? "Faktor Risiko Stunting (SHAP) & Ringkasan Eksekutif Wilayah"
                  : "Stunting Risk Factors (SHAP) & Regional Executive Summary"}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Policy Brief Ready</span>
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {section2Subtitle}
            </p>
          </div>

          {renderToggleButton(
            "shap_ai",
            "Faktor Risiko Stunting (SHAP) & Ringkasan Eksekutif Wilayah"
          )}
        </div>

        {/* Expanded Content */}
        {openSections.shap_ai && (
          <div className="mt-5 space-y-5 border-t border-slate-200 dark:border-[#232b3e] pt-5">
            {/* Active District Context Banner */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#0d121d] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    {t("sectionBadge")}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#182030] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    domain_id: {data.domain_id} · confidence: {data.data_confidence}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {data.name}
                  </h3>
                  <span className="rounded-md border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#182030] px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {data.type}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    · {data.provinceName}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-1.5 ${band.badgeClass}`}
                >
                  <span className="font-mono text-xl font-extrabold">
                    {data.actual}%
                  </span>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] font-semibold uppercase opacity-80">
                      Actual ({data.actual_tier})
                    </span>
                    <span className="text-[11px] font-bold">
                      Pred: {data.prediction}% ({data.risk_tier || riskLabel})
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#182030] px-3 py-1.5">
                  <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {t("provRankLabel")}
                  </p>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    #{data.provinceRank}{" "}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      {t("of")} {data.totalInProvince}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#182030] px-3 py-1.5">
                  <p className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {t("natRankLabel")}
                  </p>
                  <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    #{data.nationalRank}{" "}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      {t("of")} {data.totalNational}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2-Column Split: Left SHAP Chart, Right Together AI SummaryCard */}
            <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
              <div className="flex w-full">
                <FactorContributionChart factors={data.factors} />
              </div>
              <div className="flex w-full">
                <SummaryCard
                  summary={activeSummary}
                  riskLevel={data.riskLevel}
                  isLoadingNarrative={isLoadingNarrative}
                  factors={data.factors}
                  actual={data.actual}
                  prediction={data.prediction}
                  dataConfidence={data.data_confidence}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* SECTION 3: Rekomendasi Intervensi Prioritas                            */}
      {/* ===================================================================== */}
      <section
        id="rekomendasi"
        className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 text-slate-800 dark:text-slate-100 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {locale === "id"
                  ? "Rekomendasi Intervensi Prioritas"
                  : "Priority Intervention Recommendations"}
              </h2>
              <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal-700 dark:text-teal-300">
                {activeRecommendations.length}{" "}
                {locale === "id" ? "Program Prioritas" : "Priority Programs"}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {locale === "id"
                ? "Disusun secara otomatis berdasarkan faktor pendorong risiko terbesar di wilayah ini: Bantuan Pangan, Edukasi 1000 HPK, Sanitasi Air, dan Akses Terisolir."
                : "Automatically synthesized from the top risk-driving determinants in this district: Food Support, 1000 HPK Education, WASH Sanitation, and Remote Access."}
            </p>
          </div>

          {renderToggleButton("rekomendasi", "Rekomendasi Intervensi Prioritas")}
        </div>

        {openSections.rekomendasi && (
          <div className="mt-5 border-t border-slate-200 dark:border-[#232b3e] pt-5">
            <RecommendationList
              recommendations={activeRecommendations}
              isLoadingNarrative={isLoadingNarrative}
            />
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* SECTION 4: Matriks Perbandingan Indikator Wilayah                      */}
      {/* ===================================================================== */}
      <section
        id="matriks"
        className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 text-slate-800 dark:text-slate-100 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {locale === "id"
                  ? "Matriks Perbandingan Indikator Wilayah"
                  : "Regional Indicator Comparison Matrix"}
              </h2>
              <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal-700 dark:text-teal-300">
                {data.factors.length}{" "}
                {locale === "id" ? "Indikator Terpantau" : "Monitored Indicators"}
              </span>
              <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {topGapBadgeText}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {locale === "id"
                ? "Perbandingan capaian indikator daerah terhadap rata-rata provinsi dan rata-rata nasional."
                : "Comparison of local district indicator performance against provincial and national benchmarks."}
            </p>
          </div>

          {renderToggleButton(
            "matriks",
            "Matriks Perbandingan Indikator Wilayah"
          )}
        </div>

        {openSections.matriks && (
          <div className="mt-5 border-t border-slate-200 dark:border-[#232b3e] pt-5">
            <ComparisonTable factors={data.factors} />
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* SECTION 5: Kamus Indikator & Mekanisme Dampak Biologis/Sosial          */}
      {/* ===================================================================== */}
      <section
        id="kamus-indikator"
        className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 text-slate-800 dark:text-slate-100 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {locale === "id"
                  ? "Kamus Indikator & Mekanisme Dampak Biologis/Sosial"
                  : "Indicator Glossary & Biological/Social Impact Mechanisms"}
              </h2>
              <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal-700 dark:text-teal-300">
                {data.factors.length}{" "}
                {locale === "id" ? "Definisi Tersedia" : "Definitions Available"}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {locale === "id"
                ? "Definisi operasional indikator dan penjelasan mekanisme dampaknya terhadap gangguan pertumbuhan balita."
                : "Operational indicator definitions and biological/socioeconomic pathways affecting linear child growth."}
            </p>
          </div>

          {renderToggleButton(
            "kamus",
            "Kamus Indikator & Mekanisme Dampak Biologis/Sosial"
          )}
        </div>

        {openSections.kamus && (
          <div className="mt-5 space-y-4 border-t border-slate-200 dark:border-[#232b3e] pt-5">
            {/* Top Row: 3 Primary Driver Glossary Cards */}
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
              {primaryFactors.map((factor) => (
                <FactorCard
                  key={factor.id}
                  factor={factor}
                  defaultExpanded={true}
                />
              ))}
            </div>

            {/* Bottom Row: up to 5 Secondary Indicator Cards */}
            {secondaryFactors.length > 0 && (
              <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {secondaryFactors.map((factor) => (
                  <FactorCard
                    key={factor.id}
                    factor={factor}
                    defaultExpanded={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* SECTION 6: Catatan Metodologi & Tata Kelola Data                       */}
      {/* ===================================================================== */}
      <section
        id="metodologi"
        className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 text-slate-800 dark:text-slate-100 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                {locale === "id"
                  ? "Catatan Metodologi & Tata Kelola Data"
                  : "Methodology & Data Governance Note"}
              </h2>
              <span className="inline-flex items-center rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#182030] px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                GradientBoosting + TreeSHAP v2.5
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
              {locale === "id"
                ? `Sumber integrasi SSGI, Susenas BPS, validasi silang (MAE ${maeInProvince}), serta metodologi TreeSHAP.`
                : `SSGI and BPS Susenas integration, cross-validation (MAE ${maeInProvince}), and TreeSHAP decomposition methodology.`}
            </p>
          </div>

          {renderToggleButton(
            "metodologi",
            "Catatan Metodologi & Tata Kelola Data"
          )}
        </div>

        {openSections.metodologi && (
          <div className="mt-5 border-t border-slate-200 dark:border-[#232b3e] pt-5">
            <MethodologyNote methodology={data.methodology} />
          </div>
        )}
      </section>
    </div>
  );
}
