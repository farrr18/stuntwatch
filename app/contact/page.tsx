"use client";

import React from "react";
import Link from "next/link";
import { useAppLocale } from "@/lib/i18n";
import {
  ArrowLeft,
  Building2,
  Mail,
  ArrowRight,
  FileText,
  Globe,
} from "lucide-react";

export default function ContactPage() {
  const { locale } = useAppLocale();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-slate-50/70 dark:bg-[#080c15] text-slate-900 dark:text-slate-100">
      {/* Main Content Wrapper */}
      <main className="max-w-[1280px] mx-auto w-full px-6 pt-6 flex-1 flex flex-col">
        {/* 1. Top Navigation Sub-Bar (Breadcrumb & Dataset Sync Status) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-8 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-transparent border border-slate-200/80 dark:border-0 dark:border-b dark:border-slate-800/60 dark:rounded-none dark:px-0 dark:pb-3 text-xs">
          <Link
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group font-medium"
            href="/maps"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>
              {locale === "id"
                ? "Kembali ke Peta Nasional"
                : "Back to National Map"}
            </span>
          </Link>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>{locale === "id" ? "Edisi 2025.1" : "Edition 2025.1"}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
              {locale === "id"
                ? "Data Terintegrasi BPS & SKI"
                : "Integrated BPS & SKI Data"}
            </span>
          </div>
        </div>

        {/* 2. Centered Outer Card Container */}
        <div className="my-auto py-2">
          <section className="max-w-4xl mx-auto w-full bg-white dark:bg-[#0d121f]/90 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-8 lg:p-11 shadow-sm dark:shadow-2xl backdrop-blur-md">
            {/* Intro Section */}
            <div>
              <span className="inline-block text-xs font-bold tracking-wider uppercase mb-3 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/20">
                {locale === "id"
                  ? "KOORDINASI & INTEGRASI DATA"
                  : "COORDINATION & DATA INTEGRATION"}
              </span>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {locale === "id"
                  ? "Hubungi Tim Pengembang & Sekretariat StuntWatch"
                  : "Contact StuntWatch Secretariat & Engineering Team"}
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base mt-3 leading-relaxed max-w-3xl">
                {locale === "id"
                  ? "Untuk integrasi API e-PPGBM, pembaruan batas wilayah TopoJSON BPS terbaru, atau kolaborasi perencanaan intervensi daerah (Bappeda/Dinkes/BKKBN)."
                  : "For live e-PPGBM API integration, updated official BPS TopoJSON administrative boundaries, or regional intervention planning collaboration (Bappeda/Dinkes/BKKBN)."}
              </p>
            </div>

            {/* 2x2 Contact & Integration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">
              {/* Card 1 (Top-Left): Sekretariat Percepatan Penurunan Stunting */}
              <div className="rounded-2xl p-6 bg-slate-50/70 dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 hover:border-teal-400 dark:hover:border-teal-500/45 transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-lg bg-rose-100/80 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {locale === "id"
                    ? "Sekretariat Percepatan Penurunan Stunting"
                    : "National Stunting Reduction Secretariat"}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Jl. Medan Merdeka Barat, Jakarta Pusat 10110, Indonesia
                </p>
              </div>

              {/* Card 2 (Top-Right): Dukungan Teknis & Integrasi Data */}
              <div className="rounded-2xl p-6 bg-slate-50/70 dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 hover:border-teal-400 dark:hover:border-teal-500/45 transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-lg bg-amber-100/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-5">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {locale === "id"
                    ? "Dukungan Teknis & Integrasi Data"
                    : "Technical & Data Integration Support"}
                </h2>
                <a
                  href="mailto:data-integration@stuntwatch.id"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium group mt-0.5"
                >
                  <span>data-integration@stuntwatch.id</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              {/* Card 3 (Bottom-Left): Spesifikasi Kontrak Data (Mock Adapter) */}
              <div className="rounded-2xl p-6 bg-slate-50/70 dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 hover:border-teal-400 dark:hover:border-teal-500/45 transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-lg bg-teal-100/80 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-5">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {locale === "id"
                    ? "Spesifikasi Kontrak Data (Mock Adapter)"
                    : "Data Contract Specification (Mock Adapter)"}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {locale === "id" ? "Lihat berkas " : "Inspect "}
                  <code className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-[#090d16] text-slate-800 dark:text-teal-300 rounded text-xs font-mono border border-slate-300/60 dark:border-slate-800">
                    lib/types.ts
                  </code>
                  {locale === "id" ? " dan " : " and "}
                  <code className="px-1.5 py-0.5 bg-slate-200/80 dark:bg-[#090d16] text-slate-800 dark:text-teal-300 rounded text-xs font-mono border border-slate-300/60 dark:border-slate-800">
                    lib/api/mockAdapter.ts
                  </code>
                  {locale === "id"
                    ? " untuk skema JSON 38 provinsi dan 514 kabupaten/kota."
                    : " for the 38-province and 514-district JSON schemas."}
                </p>
              </div>

              {/* Card 4 (Bottom-Right): Portal Referensi Nasional */}
              <div className="rounded-2xl p-6 bg-slate-50/70 dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800/80 hover:border-teal-400 dark:hover:border-teal-500/45 transition-all hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-lg bg-cyan-100/80 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center mb-5">
                  <Globe className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {locale === "id"
                    ? "Portal Referensi Nasional"
                    : "Official National Reference Portals"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm pt-0.5">
                  <a
                    href="https://stunting.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 dark:text-cyan-400 hover:text-teal-800 dark:hover:text-cyan-300 font-medium underline underline-offset-4 transition"
                  >
                    stunting.go.id
                  </a>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <a
                    href="https://www.bps.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 dark:text-cyan-400 hover:text-teal-800 dark:hover:text-cyan-300 font-medium underline underline-offset-4 transition"
                  >
                    bps.go.id
                  </a>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <a
                    href="https://www.kemkes.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 dark:text-cyan-400 hover:text-teal-800 dark:hover:text-cyan-300 font-medium underline underline-offset-4 transition"
                  >
                    kemkes.go.id
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. Bottom Footer Bar */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#080c15] text-slate-500 dark:text-slate-400 text-xs py-6 mt-12 px-6">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-center md:text-left">
            <span className="font-bold text-teal-700 dark:text-teal-400">
              StuntWatch
            </span>
            <span>•</span>
            <span>
              {locale === "id"
                ? "© 2025 StuntWatch Indonesia. Sistem Pendukung Keputusan Spasial Nasional Terintegrasi. Hak Cipta Dilindungi Undang-Undang."
                : "© 2025 StuntWatch Indonesia. Integrated National Spatial Decision Support System. All Rights Reserved."}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <Link
              href="/faq"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {locale === "id" ? "Kebijakan Privasi" : "Privacy Policy"}
            </Link>
            <Link
              href="/faq"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {locale === "id" ? "Ketentuan Layanan" : "Terms of Service"}
            </Link>
            <Link
              href="/maps"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {locale === "id" ? "Pusat Data Kesehatan" : "Health Data Center"}
            </Link>
            <a
              href="https://www.kemkes.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {locale === "id"
                ? "Kementerian Kesehatan RI"
                : "Ministry of Health RI"}
            </a>
            <Link
              href="/faq"
              className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
            >
              {locale === "id"
                ? "Dokumentasi Metodologi"
                : "Methodology Documentation"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
