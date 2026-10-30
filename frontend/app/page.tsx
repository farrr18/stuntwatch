"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Map,
  ArrowRight,
  Globe,
  Layers,
  Building2,
  Shield,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  useProvinces,
  useMapData,
  useProvincesGeo,
  useAllKabKotaGeo,
} from "@/lib/hooks/useStuntingData";

const LeafletNationalCanvas = dynamic(
  () => import("@/components/map/LeafletNationalCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 dark:bg-[#0f131d]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-teal-500" />
        <p className="mt-2.5 text-xs font-mono text-slate-500 dark:text-slate-400">
          Initializing Live Leaflet Surveillance Layer...
        </p>
      </div>
    ),
  }
);

export default function LandingPage() {
  const router = useRouter();
  const { data: provinces } = useProvinces();
  const { data: mapData } = useMapData();
  const { data: provincesGeo } = useProvincesGeo();
  const { data: allKabGeo } = useAllKabKotaGeo();

  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(
    null
  );

  const isMapReady = Boolean(provinces && mapData && provincesGeo);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between relative overflow-hidden bg-[#f8fafc] dark:bg-[#0f131d] text-slate-900 dark:text-[#dfe2f1]">
      {/* Subtle Coordinate Grid Backdrop (Light & Dark Mode) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-100"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 25%, rgba(20, 184, 166, 0.14), transparent 45%),
            linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      />

      {/* Ambient Blurred Circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-20 -z-10 h-96 w-96 rounded-full bg-teal-300/25 dark:bg-teal-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 -z-10 h-80 w-80 rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-3xl"
      />

      {/* Main Content: Split Hero + 3-Column Bento Metric Deck */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 lg:py-14 flex-1 flex flex-col justify-center">
        {/* TOP HERO: 12-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* LEFT COLUMN (6 Cols): Status Badge, BrandLogo, Description, Primary CTA */}
          <div className="lg:col-span-6 flex flex-col items-start gap-5 z-10 text-left">
            {/* Pulsing Red Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50/90 dark:bg-[#171b26] border border-teal-200/80 dark:border-slate-700/60 text-xs font-mono text-teal-900 dark:text-slate-200 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="font-medium">
                Sistem Pendukung Keputusan Spasial Nasional
              </span>
            </div>

            {/* BrandLogo (variant="full") + Screen-Reader H1 */}
            <div>
              <h1 className="sr-only">
                StuntWatch — Peta Risiko Stunting Indonesia
              </h1>
              <BrandLogo
                variant="full"
                className="text-5xl sm:text-6xl lg:text-7xl items-start"
              />
            </div>

            {/* Description Paragraph */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-[560px] leading-relaxed">
              StuntWatch adalah platform pemantauan dan pemetaan risiko stunting
              interaktif di seluruh 38 provinsi dan 514 kabupaten/kota di
              Indonesia. Melalui pemodelan indeks risiko terpadu (0–100) dan
              dekomposisi faktor determinan berbasis SHAP, pembuat kebijakan
              dapat menelusuri wilayah prioritas dari tingkat nasional hingga
              intervensi spesifik di tingkat kabupaten/kota.
            </p>

            {/* Primary CTA Button & Helper Caption */}
            <div className="flex flex-col items-start gap-2.5 pt-1">
              <Link
                href="/maps"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-[#14b8a6] dark:hover:bg-[#29a195] text-white dark:text-slate-950 font-semibold text-base shadow-md hover:shadow-[0_0_24px_rgba(20,184,166,0.4)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                <Map className="w-5 h-5" />
                <span>Maps</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 pl-1">
                Jelajahi Peta Risiko 38 Provinsi
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN (6 Cols): Live Leaflet Spatial Surveillance Card */}
          <div className="lg:col-span-6 w-full">
            <div className="rounded-2xl bg-white/95 dark:bg-[#0a0e18]/85 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl dark:shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Card Top Bar */}
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] font-mono font-semibold tracking-wider text-slate-800 dark:text-slate-200">
                  <Globe className="w-4 h-4 text-teal-600 dark:text-[#4fdbc8]" />
                  <span>INDONESIA SPATIAL SURVEILLANCE LAYER</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>CRS: EPSG:4326</span>
                  <span>•</span>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 dark:text-[#4edea3] font-semibold">
                    Live Model
                  </span>
                </div>
              </div>

              {/* Live Leaflet Map Viewport */}
              <div className="relative w-full aspect-[16/10] min-h-[280px] sm:min-h-[320px] bg-slate-50 dark:bg-[#0f131d] rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden isolate">
                <div className="absolute inset-0 w-full h-full z-0">
                  {isMapReady ? (
                    <LeafletNationalCanvas
                      compact
                      provinces={provinces!}
                      mapData={mapData!}
                      provincesGeo={provincesGeo!}
                      allKabGeo={allKabGeo}
                      layerMode="kabupaten"
                      hoveredProvinceId={hoveredProvinceId}
                      selectedIslandGroup="ALL"
                      onHoverProvince={setHoveredProvinceId}
                      onSelectProvince={(slug) =>
                        router.push(`/provinsi/${slug}`)
                      }
                      onSelectDistrict={(provSlug, domainId) =>
                        router.push(`/provinsi/${provSlug}/${domainId}`)
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 dark:bg-[#0f131d]">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-teal-500" />
                      <p className="mt-2.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                        Loading Live Map Data (`/api/map-data`)...
                      </p>
                    </div>
                  )}
                </div>

                {/* Floating Bottom-Left Spotlight Pill Overlaid on the Leaflet Map */}
                <div className="absolute bottom-3 left-3 z-[500] pointer-events-none bg-white/95 dark:bg-[#262a35]/90 border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-md rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <div className="text-[11px] font-mono">
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">
                      Wilayah Pantauan Utama:
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-bold ml-1">
                      NTT &amp; Papua (81.4)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Bottom Bar: SPEKTRUM RISIKO */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <span className="font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  SPEKTRUM RISIKO:
                </span>
                <div className="flex flex-wrap items-center gap-3 text-slate-700 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                    <span>Rendah (0–24)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                    <span>Sedang (25–49)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" />
                    <span>Tinggi (50–74)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                    <span>Sangat Tinggi (75–100)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM 3-COLUMN BENTO METRIC DECK */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: 38 Provinsi */}
          <div className="flex items-center justify-between rounded-2xl bg-white/95 dark:bg-[#171b26]/90 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm backdrop-blur-md">
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CAKUPAN WILAYAH TINGKAT I
              </p>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-bold font-mono text-slate-900 dark:text-white">
                  38
                </span>
                <span className="text-lg font-semibold text-teal-700 dark:text-[#4fdbc8]">
                  Provinsi
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-[#262a35] text-teal-700 dark:text-[#4fdbc8]">
              <Layers className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2: 514 Kabupaten/Kota */}
          <div className="flex items-center justify-between rounded-2xl bg-white/95 dark:bg-[#171b26]/90 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm backdrop-blur-md">
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CAKUPAN WILAYAH TINGKAT II
              </p>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-bold font-mono text-slate-900 dark:text-white">
                  514
                </span>
                <span className="text-lg font-semibold text-teal-700 dark:text-[#4fdbc8]">
                  Kabupaten/Kota
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-[#262a35] text-teal-700 dark:text-[#4fdbc8]">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3: 12 Indikator Determinan */}
          <div className="flex items-center justify-between rounded-2xl bg-white/95 dark:bg-[#171b26]/90 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm backdrop-blur-md">
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                ANALISIS SHAP MULTISEKTORAL
              </p>
              <div className="mt-2 flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-bold font-mono text-slate-900 dark:text-white">
                  12
                </span>
                <span className="text-lg font-semibold text-teal-700 dark:text-[#4fdbc8]">
                  Indikator Determinan
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-[#262a35] text-teal-700 dark:text-[#4fdbc8]">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM INSTITUTIONAL FOOTER BAR */}
      <footer className="w-full bg-white dark:bg-[#0a0e18] border-t border-slate-200 dark:border-slate-800/80 mt-12 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-700 dark:text-[#4fdbc8]">
              StuntWatch
            </span>
            <span className="text-xs font-mono text-slate-400">
              v2.4-spatial
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © 2025 StuntWatch Indonesia. Sistem Pendukung Keputusan Spasial
            Nasional Terintegrasi. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  );
}
