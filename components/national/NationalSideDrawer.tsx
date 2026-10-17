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
  Radio,
  X,
} from "lucide-react";
import type { Province, TopRiskyDistrict } from "@/lib/types";
import { getRiskBandConfig } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

const ISLAND_GROUPS = [
  "ALL",
  "Sumatera",
  "Jawa",
  "Bali & Nusa Tenggara",
  "Kalimantan",
  "Sulawesi",
  "Maluku & Papua",
];

type DrawerTab = "provinces" | "watchlist";
type MobileSnapState = "peek" | "half" | "full";

interface NationalSideDrawerProps {
  provinces: Province[];
  filteredProvinces: Province[];
  topRiskyDistricts: TopRiskyDistrict[] | undefined;
  isLoadingWatchlist: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedIslandGroup: string;
  onIslandGroupChange: (group: string) => void;
  hoveredProvinceId: string | null;
  onHoverProvince: (slug: string | null) => void;
  onFlyToLocation: (type: "province" | "district", id: string) => void;
}

export function NationalSideDrawer({
  provinces,
  filteredProvinces,
  topRiskyDistricts,
  isLoadingWatchlist,
  isOpen,
  onToggleOpen,
  searchQuery,
  onSearchChange,
  selectedIslandGroup,
  onIslandGroupChange,
  hoveredProvinceId,
  onHoverProvince,
  onFlyToLocation,
}: NationalSideDrawerProps) {
  const router = useRouter();
  const t = useTranslations("national");
  const { locale } = useAppLocale();

  const [activeTab, setActiveTab] = useState<DrawerTab>("provinces");
  const [mobileSnap, setMobileSnap] = useState<MobileSnapState>("half");

  const cycleMobileSnap = () => {
    setMobileSnap((prev) =>
      prev === "peek" ? "half" : prev === "half" ? "full" : "peek"
    );
  };

  const mobileHeightClass =
    mobileSnap === "peek"
      ? "h-[96px]"
      : mobileSnap === "half"
      ? "h-[48vh]"
      : "h-[82vh]";

  const renderTabsAndBody = (isMobileSheet: boolean) => (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header + Live Status + Tabs */}
      <div className="shrink-0 border-b border-border bg-card/95 px-4 pb-3 pt-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="truncate text-sm font-extrabold tracking-tight text-foreground">
              {t("title")}
            </h1>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#159A7C]/40 bg-[#159A7C]/10 px-2 py-0.5 text-[10px] font-semibold text-[#159A7C] dark:text-[#2DD4BF]">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            <span>Live API</span>
          </span>
        </div>

        {/* Accessible 2-Tab Bar: Provinsi (38) & Watchlist (15) */}
        <div
          role="tablist"
          aria-label={
            locale === "id"
              ? "Panel Data Nasional: Provinsi dan Watchlist"
              : "National Data Panel: Provinces and Watchlist"
          }
          className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1"
        >
          <button
            type="button"
            role="tab"
            id={isMobileSheet ? "tab-mobile-prov" : "tab-desktop-prov"}
            aria-selected={activeTab === "provinces"}
            aria-controls={
              isMobileSheet ? "panel-mobile-prov" : "panel-desktop-prov"
            }
            onClick={() => {
              setActiveTab("provinces");
              if (isMobileSheet && mobileSnap === "peek") setMobileSnap("half");
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "provinces"
                ? "bg-background text-foreground shadow-sm dark:bg-slate-800 dark:text-teal-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Table2 className="h-3.5 w-3.5 text-[#159A7C] dark:text-teal-400" />
            <span>Provinsi ({provinces.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            id={isMobileSheet ? "tab-mobile-watch" : "tab-desktop-watch"}
            aria-selected={activeTab === "watchlist"}
            aria-controls={
              isMobileSheet ? "panel-mobile-watch" : "panel-desktop-watch"
            }
            onClick={() => {
              setActiveTab("watchlist");
              if (isMobileSheet && mobileSnap === "peek") setMobileSnap("half");
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "watchlist"
                ? "bg-background text-foreground shadow-sm dark:bg-slate-800 dark:text-rose-400"
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
          id={isMobileSheet ? "panel-mobile-prov" : "panel-desktop-prov"}
          aria-labelledby={
            isMobileSheet ? "tab-mobile-prov" : "tab-desktop-prov"
          }
          className="flex flex-1 flex-col overflow-hidden"
        >
          {/* Search Input & Island Filter Pills */}
          <div className="shrink-0 space-y-2 border-b border-border bg-card/60 px-4 py-2.5">
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
                  aria-label="Clear search"
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
                    onClick={() => onIslandGroupChange(group)}
                    aria-pressed={isActive}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {group === "ALL" ? t("islandFilterAll") : group}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-0.5 text-[11px] font-semibold text-muted-foreground">
              <span className="uppercase tracking-wide">
                {locale === "id"
                  ? "DAFTAR 38 PROVINSI — INDEKS & RISIKO STUNTING"
                  : "38 PROVINCES — STUNTING INDEX & RISK"}
              </span>
              <span className="font-mono font-bold">
                {filteredProvinces.length}/{provinces.length}
              </span>
            </div>
          </div>

          {/* Scrollable 38-Province List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2.5">
            {filteredProvinces.map((p) => {
              const band = getRiskBandConfig(p.riskLevel);
              const isHovered =
                hoveredProvinceId === p.slug || hoveredProvinceId === p.id;
              return (
                <Link
                  key={p.slug}
                  href={`/provinsi/${p.slug}`}
                  onMouseEnter={() => {
                    onHoverProvince(p.slug);
                    onFlyToLocation("province", p.slug);
                  }}
                  onMouseLeave={() => onHoverProvince(null)}
                  onFocus={() => {
                    onHoverProvince(p.slug);
                    onFlyToLocation("province", p.slug);
                  }}
                  onBlur={() => onHoverProvince(null)}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isHovered
                      ? "border-foreground bg-accent shadow-sm"
                      : "border-border/75 bg-background hover:bg-muted/50 dark:bg-[#1c1f2a]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${band.dotClass}`}
                        aria-hidden="true"
                      />
                      <span className="truncate font-bold text-foreground">
                        {p.name}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate pl-4 text-[10px] text-muted-foreground">
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

      {/* TAB 2 CONTENT: National Watchlist (15 Priority Kabupaten/Kota, n=15) */}
      {activeTab === "watchlist" && (
        <div
          role="tabpanel"
          id={isMobileSheet ? "panel-mobile-watch" : "panel-desktop-watch"}
          aria-labelledby={
            isMobileSheet ? "tab-mobile-watch" : "tab-desktop-watch"
          }
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 flex items-center justify-between border-b border-border bg-card/60 px-4 py-2.5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                National Watchlist
              </h2>
              <p className="text-[10px] text-muted-foreground">
                {locale === "id"
                  ? "15 Kabupaten/Kota Prioritas Utama (Risiko Sangat Tinggi)"
                  : "15 Priority Districts (Very High Risk)"}
              </p>
            </div>
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#D9463E]">
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
                return (
                  <Link
                    key={item.domain_id}
                    href={`/provinsi/${item.provinceSlug}/${item.domain_id}`}
                    onMouseEnter={() => {
                      onHoverProvince(String(item.domain_id));
                      onFlyToLocation("district", String(item.domain_id));
                    }}
                    onMouseLeave={() => onHoverProvince(null)}
                    onFocus={() => {
                      onHoverProvince(String(item.domain_id));
                      onFlyToLocation("district", String(item.domain_id));
                    }}
                    onBlur={() => onHoverProvince(null)}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-border/75 bg-background p-2.5 text-xs transition-all hover:border-[#D9463E] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-[#1c1f2a]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${band.dotClass}`}
                          aria-hidden="true"
                        />
                        <span className="truncate font-bold text-foreground group-hover:text-[#D9463E]">
                          {item.kabupaten_kota}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate pl-4 text-[10px] text-muted-foreground">
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

  return (
    <>
      {/* 1. DESKTOP COLLAPSIBLE RIGHT PANEL (>= 1024px) */}
      <div className="relative hidden h-full shrink-0 lg:flex">
        {/* Collapse / Expand Handle Button Docked on Left Edge */}
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          aria-controls="national-desktop-drawer"
          aria-label={
            isOpen
              ? locale === "id"
                ? "Sembunyikan panel samping"
                : "Collapse side panel"
              : locale === "id"
              ? "Buka panel samping Provinsi & Watchlist"
              : "Expand Provinces & Watchlist side panel"
          }
          title={
            isOpen
              ? locale === "id"
                ? "Sembunyikan Panel"
                : "Collapse Panel"
              : locale === "id"
              ? "Buka Panel"
              : "Expand Panel"
          }
          className="absolute -left-9 top-1/2 z-[500] flex h-16 w-9 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-border bg-card/95 text-foreground shadow-lg backdrop-blur-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isOpen ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <aside
          id="national-desktop-drawer"
          aria-label={
            locale === "id"
              ? "Panel Daftar Provinsi dan National Watchlist"
              : "Province Directory and National Watchlist Panel"
          }
          className={`h-full overflow-hidden border-l border-border bg-card/95 backdrop-blur-md transition-[width,opacity] duration-250 ease-out dark:bg-[#171b26]/95 ${
            isOpen
              ? "w-[380px] xl:w-[400px] opacity-100"
              : "w-0 border-l-0 opacity-0"
          }`}
        >
          <div className="h-full w-[380px] xl:w-[400px]">
            {renderTabsAndBody(false)}
          </div>
        </aside>
      </div>

      {/* 2. TABLET & MOBILE BOTTOM SHEET (< 1024px) WITH 3 SNAP STATES */}
      <aside
        aria-label={
          locale === "id"
            ? "Lembar Bawah Daftar Provinsi dan Watchlist"
            : "Province Directory and Watchlist Bottom Sheet"
        }
        className={`fixed inset-x-0 bottom-0 z-[500] flex flex-col rounded-t-2xl border-t border-border bg-card/95 shadow-2xl backdrop-blur-md transition-[height] duration-250 ease-out dark:bg-[#171b26]/95 lg:hidden ${mobileHeightClass}`}
      >
        {/* Drag / Tap Snap Handle Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-1.5">
          <button
            type="button"
            onClick={cycleMobileSnap}
            aria-label={
              locale === "id"
                ? `Ubah ukuran panel (saat ini: ${mobileSnap})`
                : `Cycle sheet height (current: ${mobileSnap})`
            }
            className="mx-auto flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
            <span className="sr-only">Toggle sheet height</span>
          </button>

          <div className="flex items-center gap-1">
            {(["peek", "half", "full"] as MobileSnapState[]).map((snap) => (
              <button
                key={snap}
                type="button"
                onClick={() => setMobileSnap(snap)}
                aria-pressed={mobileSnap === snap}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  mobileSnap === snap
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {snap === "peek" ? (
                  <ChevronDown className="h-3 w-3" />
                ) : snap === "half" ? (
                  "50%"
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">{renderTabsAndBody(true)}</div>
      </aside>
    </>
  );
}
