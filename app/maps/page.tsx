"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Keyboard, ArrowUpRight, X } from "lucide-react";
import {
  useProvinces,
  useTopRiskyDistricts,
} from "@/lib/hooks/useStuntingData";
import { getRiskBandConfig, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";
import { IndonesiaMap } from "@/components/map/IndonesiaMap";
import { NationalSideDrawer } from "@/components/national/NationalSideDrawer";

export default function NationalMapsPage() {
  const t = useTranslations("national");
  const { locale } = useAppLocale();
  const workspaceRef = useRef<HTMLElement | null>(null);

  // Live Endpoint 1: GET /api/provinces
  const { data: provinces, isLoading: isLoadingProvinces } = useProvinces();
  // Live Endpoint 2: GET /api/top-risky?n=15
  const { data: topRiskyDistricts, isLoading: isLoadingWatchlist } =
    useTopRiskyDistricts(15);

  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(
    null
  );
  const [hoveredDistrictId, setHoveredDistrictId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIslandGroup, setSelectedIslandGroup] = useState<string>("ALL");
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isKeyboardDirOpen, setIsKeyboardDirOpen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && workspaceRef.current) {
        await workspaceRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const filteredProvinces = useMemo(() => {
    if (!provinces) return [];
    const q = searchQuery.trim().toLowerCase();
    return provinces.filter((p) => {
      const matchesIsland =
        selectedIslandGroup === "ALL" || p.islandGroup === selectedIslandGroup;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.highest_risk_kabupaten.toLowerCase().includes(q) ||
        p.islandGroup.toLowerCase().includes(q);
      return matchesIsland && matchesQuery;
    });
  }, [provinces, searchQuery, selectedIslandGroup]);

  if (isLoadingProvinces || !provinces) {
    return (
      <main className="relative flex h-[calc(100vh-4rem)] min-h-[600px] w-full items-center justify-center overflow-hidden bg-background p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-8 py-10 shadow-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Loading 38-Province Live StuntWatch Map Workspace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={workspaceRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[100] flex h-screen w-screen overflow-hidden bg-background"
          : "relative flex h-[calc(100vh-4rem)] min-h-[600px] w-full overflow-hidden bg-background"
      }
    >
      {/* LEFT / CENTER MAP HERO (Occupies 72%-79% on desktop, 100% when drawer is collapsed) */}
      <section
        aria-label={t("title")}
        className="relative flex h-full min-w-0 flex-1 overflow-hidden"
      >
        <IndonesiaMap
          provinces={provinces}
          hoveredProvinceId={hoveredProvinceId}
          hoveredDistrictId={hoveredDistrictId}
          onHoverProvince={setHoveredProvinceId}
          selectedIslandGroup={selectedIslandGroup}
          onSelectIslandGroup={setSelectedIslandGroup}
          isDrawerCollapsed={isDrawerCollapsed}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </section>

      {/* RIGHT COLLAPSIBLE TABBED DRAWER (Desktop >= 1024px) & SNAPPING BOTTOM SHEET (Mobile < 1024px) */}
      <NationalSideDrawer
        provinces={provinces}
        filteredProvinces={filteredProvinces}
        topRiskyDistricts={topRiskyDistricts}
        isLoadingWatchlist={isLoadingWatchlist}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIslandGroup={selectedIslandGroup}
        onSelectIslandGroup={setSelectedIslandGroup}
        hoveredProvinceId={hoveredProvinceId}
        onHoverProvince={setHoveredProvinceId}
        hoveredDistrictId={hoveredDistrictId}
        onHoverDistrict={setHoveredDistrictId}
        isCollapsed={isDrawerCollapsed}
        onToggleCollapse={() => setIsDrawerCollapsed((prev) => !prev)}
        onOpenKeyboardDirectory={() => setIsKeyboardDirOpen(true)}
      />

      {/* ACCESSIBLE 38-PROVINCE KEYBOARD DIRECTORY MODAL OVERLAY */}
      {isKeyboardDirOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("directoryTitle")}
          className="fixed inset-0 z-[600] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-[#D9463E]" />
                  <h2 className="text-sm font-bold text-foreground sm:text-base">
                    {t("directoryTitle")}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("directorySubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyboardDirOpen(false)}
                aria-label="Close accessible province directory"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2.5 overflow-y-auto p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProvinces.map((prov) => {
                const band = getRiskBandConfig(prov.riskLevel);
                const levelLabel = getRiskLabel(prov.riskLevel, locale);
                return (
                  <Link
                    key={prov.slug}
                    href={`/provinsi/${prov.slug}`}
                    aria-label={`${prov.name}, predicted risk ${prov.avg_predicted}%, actual ${prov.avg_actual}%, ${levelLabel}, national rank ${prov.nationalRank} of 38`}
                    className="group flex flex-col justify-between gap-2 rounded-xl border border-border/80 bg-background p-3 transition-all hover:border-foreground/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            #{prov.nationalRank}
                          </span>
                          <span className="truncate text-sm font-bold text-foreground group-hover:text-[#D9463E]">
                            {prov.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {prov.islandGroup} · {prov.n_kabupaten} Kab/Kota
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 pt-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold ${band.badgeClass}`}
                      >
                        <span className="font-mono">
                          Pred {prov.avg_predicted}%
                        </span>
                        <span className="text-[10px]">· {levelLabel}</span>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Act {prov.avg_actual}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
