"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  AlertTriangle,
  Table2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Keyboard,
  Radio,
  X,
} from "lucide-react";
import type { Province, TopRiskyDistrict } from "@/lib/types";
import { getRiskBandConfig } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

export const ISLAND_GROUPS = [
  "ALL",
  "Sumatera",
  "Jawa",
  "Bali & Nusa Tenggara",
  "Kalimantan",
  "Sulawesi",
  "Maluku & Papua",
];

export type MobileSnapState = "peek" | "half" | "full";

interface NationalSideDrawerProps {
  provinces: Province[];
  filteredProvinces: Province[];
  topRiskyDistricts: TopRiskyDistrict[] | undefined;
  isLoadingWatchlist: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedIslandGroup: string;
  onSelectIslandGroup: (group: string) => void;
  hoveredProvinceId: string | null;
  onHoverProvince: (slug: string | null) => void;
  hoveredDistrictId: string | null;
  onHoverDistrict: (domainId: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenKeyboardDirectory: () => void;
}

export function NationalSideDrawer({
  filteredProvinces,
  topRiskyDistricts,
  isLoadingWatchlist,
  searchQuery,
  onSearchChange,
  selectedIslandGroup,
  onSelectIslandGroup,
  hoveredProvinceId,
  onHoverProvince,
  hoveredDistrictId,
  onHoverDistrict,
  isCollapsed,
  onToggleCollapse,
  onOpenKeyboardDirectory,
}: NationalSideDrawerProps) {
  const router = useRouter();
  const t = useTranslations("national");
  const { locale } = useAppLocale();

  const [activeTab, setActiveTab] = useState<"provinces" | "watchlist">(
    "provinces"
  );
  const [mobileSnap, setMobileSnap] = useState<MobileSnapState>("half");

  const cycleMobileSnap = () => {
    setMobileSnap((prev) =>
      prev === "peek" ? "half" : prev === "half" ? "full" : "peek"
    );
  };

  const renderDrawerInnerContent = (isMobileSheet: boolean) => (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Compact Drawer Header + Live Status */}
      <div className="shrink-0 border-b border-border px-4 pb-3 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-sm font-extrabold tracking-tight text-foreground">
                {t("title")}
              </h1>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#159A7C]/40 bg-[#159A7C]/10 px-2 py-0.5 text-[10px] font-bold text-[#159A7C] dark:text-[#2DD4BF]">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                <span>Live API</span>
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenKeyboardDirectory}
            title={t("directoryTitle")}
            aria-label={t("directoryTitle")}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/60 px-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Keyboard className="h-3 w-3 text-[#D9463E]" />
            <span className="hidden xl:inline">A11y</span>
          </button>
        </div>

        {/* Accessible 2-Tab Switcher: Provinsi (38) vs Watchlist (15) */}
        <div
          role="tablist"
          aria-label={
            locale === "id"
              ? "Panel Data Nasional: Provinsi atau Watchlist"
              : "National Data Panel: Provinces or Watchlist"
          }
          className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1"
        >
          <button
            type="button"
            role="tab"
            id={isMobileSheet ? "tab-mobile-provinces" : "tab-desktop-provinces"}
            aria-selected={activeTab === "provinces"}
            aria-controls={
              isMobileSheet
                ? "panel-mobile-provinces"
                : "panel-desktop-provinces"
            }
            onClick={() => {
              setActiveTab("provinces");
              if (isMobileSheet && mobileSnap === "peek") setMobileSnap("half");
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "provinces"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 className="h-3.5 w-3.5 text-[#159A7C] dark:text-[#2DD4BF]" />
            <span>
              {locale === "id" ? "Provinsi" : "Provinces"} (
              {filteredProvinces.length}/38)
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id={isMobileSheet ? "tab-mobile-watchlist" : "tab-desktop-watchlist"}
            aria-selected={activeTab === "watchlist"}
            aria-controls={
              isMobileSheet
                ? "panel-mobile-watchlist"
                : "panel-desktop-watchlist"
            }
            onClick={() => {
              setActiveTab("watchlist");
              if (isMobileSheet && mobileSnap === "peek") setMobileSnap("half");
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "watchlist"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-[#D9463E]" />
            <span>Watchlist (15)</span>
          </button>
        </div>
      </div>

      {/* TAB 1 CONTENT: Tabel 38 Provinsi (Risiko Tertinggi) */}
      {activeTab === "provinces" && (
        <div
          role="tabpanel"
          id={
            isMobileSheet
              ? "panel-mobile-provinces"
              : "panel-desktop-provinces"
          }
          aria-labelledby={
            isMobileSheet ? "tab-mobile-provinces" : "tab-desktop-provinces"
          }
          className="flex flex-1 flex-col overflow-hidden"
        >
          {/* Search Input + Island Group Filter Pills */}
          <div className="shrink-0 space-y-2.5 border-b border-border bg-muted/20 px-4 py-2.5">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredProvinces.length > 0) {
                    router.push(`/provinsi/${filteredProvinces[0].slug}`);
                  }
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="h-8 w-full rounded-lg border border-input bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear province search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div
              role="group"
              aria-label="Filter by island group"
              className="flex flex-wrap items-center gap-1"
            >
              {ISLAND_GROUPS.map((group) => {
                const isActive = selectedIslandGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => onSelectIslandGroup(group)}
                    aria-pressed={isActive}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {group === "ALL" ? t("islandFilterAll") : group}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subheader */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>
              {locale === "id"
                ? "Tabel 38 Provinsi (Risiko Tertinggi)"
                : "38 Provinces (Sorted by Risk)"}
            </span>
            <span className="font-mono">{filteredProvinces.length}/38</span>
          </div>

          {/* Scrollable Province List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2.5">
            {filteredProvinces.map((p) => {
              const band = getRiskBandConfig(p.riskLevel);
              const isHovered =
                hoveredProvinceId === p.slug || hoveredProvinceId === p.id;
              return (
                <Link
                  key={p.slug}
                  href={`/provinsi/${p.slug}`}
                  onMouseEnter={() => onHoverProvince(p.slug)}
                  onMouseLeave={() => onHoverProvince(null)}
                  onFocus={() => onHoverProvince(p.slug)}
                  onBlur={() => onHoverProvince(null)}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isHovered
                      ? "border-foreground bg-accent shadow-sm"
                      : "border-border/70 bg-background hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-muted-foreground">
                        #{p.nationalRank}
                      </span>
                      <span className="truncate font-bold text-foreground">
                        {p.name}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      Act: {p.avg_actual}% · Max: {p.highest_risk_kabupaten}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${band.badgeClass}`}
                    >
                      {p.avg_predicted.toFixed(1)}%
                    </span>
                    <span className="mt-0.5 text-[9px] text-muted-foreground">
                      {p.n_kabupaten} Kab/Kota
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2 CONTENT: National Watchlist (Top 15 Kabupaten/Kota) */}
      {activeTab === "watchlist" && (
        <div
          role="tabpanel"
          id={
            isMobileSheet
              ? "panel-mobile-watchlist"
              : "panel-desktop-watchlist"
          }
          aria-labelledby={
            isMobileSheet ? "tab-mobile-watchlist" : "tab-desktop-watchlist"
          }
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                National Watchlist
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {locale === "id"
                  ? "Top 15 Kabupaten/Kota Risiko Tertinggi"
                  : "Top 15 Highest-Risk Districts Nationally"}
              </p>
            </div>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#D9463E]">
              n=15
            </span>
          </div>

          {isLoadingWatchlist || !topRiskyDistricts ? (
            <div className="flex flex-1 items-center justify-center p-6 text-xs text-muted-foreground">
              Loading National Watchlist...
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2.5">
              {topRiskyDistricts.map((item) => {
                const band = getRiskBandConfig(item.riskLevel);
                const isHovered =
                  hoveredDistrictId === String(item.domain_id);
                return (
                  <Link
                    key={item.domain_id}
                    href={`/provinsi/${item.provinceSlug}/${item.domain_id}`}
                    onMouseEnter={() =>
                      onHoverDistrict(String(item.domain_id))
                    }
                    onMouseLeave={() => onHoverDistrict(null)}
                    onFocus={() => onHoverDistrict(String(item.domain_id))}
                    onBlur={() => onHoverDistrict(null)}
                    className={`group flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isHovered
                        ? "border-[#D9463E] bg-accent shadow-sm"
                        : "border-border/75 bg-background hover:border-[#D9463E] hover:bg-muted/50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-rose-500/15 font-mono text-[10px] font-bold text-[#D9463E]">
                          #{item.rank}
                        </span>
                        <span className="truncate font-bold text-foreground group-hover:text-[#D9463E]">
                          {item.kabupaten_kota}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {item.provinsi} · Act: {item.actual}%
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${band.badgeClass}`}
                      >
                        {item.prediction.toFixed(1)}%
                      </span>
                      <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">
                        {item.risk_tier}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const mobileHeightClass =
    mobileSnap === "peek"
      ? "h-28"
      : mobileSnap === "half"
      ? "h-[48vh]"
      : "h-[82vh]";

  return (
    <>
      {/* DESKTOP (>= 1024px) RIGHT COLLAPSIBLE TABBED DRAWER */}
      <div className="relative hidden h-full shrink-0 lg:flex">
        {/* Protruding Collapse/Expand Handle on Left Edge */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!isCollapsed}
          aria-label={
            isCollapsed
              ? locale === "id"
                ? "Buka panel Provinsi & Watchlist"
                : "Expand Provinces & Watchlist panel"
              : locale === "id"
              ? "Sembunyikan panel samping untuk memperluas peta"
              : "Collapse side panel to expand map"
          }
          title={
            isCollapsed
              ? locale === "id"
                ? "Buka Panel Data"
                : "Expand Data Panel"
              : locale === "id"
              ? "Perluas Peta (Sembunyikan Panel)"
              : "Collapse Panel"
          }
          className="absolute -left-8 top-1/2 z-[450] flex h-16 w-8 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-border bg-card/95 text-foreground shadow-md backdrop-blur-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <aside
          aria-label={
            locale === "id"
              ? "Panel Data Provinsi dan National Watchlist"
              : "Provinces and National Watchlist Panel"
          }
          className={`h-full overflow-hidden border-l border-border bg-card/95 backdrop-blur-md transition-[width] duration-300 ease-in-out motion-reduce:transition-none ${
            isCollapsed ? "w-0 border-l-0" : "w-[380px] xl:w-[400px]"
          }`}
        >
          <div className="h-full w-[380px] xl:w-[400px]">
            {renderDrawerInnerContent(false)}
          </div>
        </aside>
      </div>

      {/* MOBILE / TABLET (< 1024px) SNAPPING BOTTOM SHEET */}
      <div
        aria-label={
          locale === "id"
            ? "Lembar Bawah Data Provinsi dan Watchlist"
            : "Mobile Provinces and Watchlist Bottom Sheet"
        }
        className={`fixed inset-x-0 bottom-0 z-[500] flex flex-col rounded-t-2xl border-t border-border bg-card/95 shadow-2xl backdrop-blur-md transition-[height] duration-300 ease-out motion-reduce:transition-none lg:hidden ${mobileHeightClass}`}
      >
        {/* Drag / Tap Handle Bar + Snap Controls */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-1.5">
          <button
            type="button"
            onClick={cycleMobileSnap}
            aria-label="Cycle bottom sheet height (Peek, Half, Full)"
            className="mx-auto flex flex-col items-center justify-center py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="h-1.5 w-12 rounded-full bg-muted-foreground/40" />
          </button>

          <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <button
              type="button"
              onClick={() =>
                setMobileSnap((s) => (s === "full" ? "half" : "full"))
              }
              aria-label={
                mobileSnap === "full"
                  ? "Restore bottom sheet to half height"
                  : "Expand bottom sheet to full height"
              }
              className="inline-flex h-6 w-6 items-center justify-center rounded border border-border/60 bg-muted/50 text-foreground"
            >
              {mobileSnap === "full" ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderDrawerInnerContent(true)}
        </div>
      </div>
    </>
  );
}
