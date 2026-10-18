"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAppLocale } from "@/lib/i18n";
import {
  ArrowLeft,
  HelpCircle,
  Layers,
  TrendingUp,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
} from "lucide-react";

interface FaqItemData {
  id: string;
  chipLabel: { id: string; en: string };
  question: { id: string; en: string };
  answer: { id: string; en: string };
  badge?: { id: string; en: string };
}

const FAQ_TOPICS: FaqItemData[] = [
  {
    id: "faq-1",
    chipLabel: {
      id: "1. Indeks Risiko StuntWatch (0–100)",
      en: "1. StuntWatch Risk Index (0–100)",
    },
    question: {
      id: "Apa itu Indeks Risiko Stunting StuntWatch (0–100)?",
      en: "What is the StuntWatch Stunting Risk Index (0–100)?",
    },
    answer: {
      id: "Skor komposit ternormalisasi (0 hingga 100) yang memodelkan kerentanan struktural provinsi atau kabupaten/kota terhadap kejadian stunting balita berdasarkan integrasi data SSGI/SKI dan determinan multisektoral SUSENAS BPS. Skor 0–24 dikategorikan Rendah, 25–49 Sedang, 50–74 Tinggi, dan 75–100 Sangat Tinggi.",
      en: "A normalized composite score (0 to 100) modeling a province or district's structural vulnerability to childhood stunting based on integrated SSGI/SKI prevalence and BPS SUSENAS multisectoral determinants. Scores 0–24 represent Low risk, 25–49 Moderate, 50–74 High, and 75–100 Very High risk.",
    },
    badge: {
      id: "Skala Komposit 0–100",
      en: "Composite Scale 0–100",
    },
  },
  {
    id: "faq-2",
    chipLabel: {
      id: "2. Cara Membaca Grafik SHAP",
      en: "2. Reading the SHAP Chart",
    },
    question: {
      id: "Bagaimana cara membaca Grafik Kontribusi Faktor (SHAP)?",
      en: "How do I interpret the Factor Contribution (SHAP) Chart?",
    },
    answer: {
      id: "Grafik kontribusi faktor mengadopsi pendekatan SHapley Additive exPlanations (TreeSHAP) dengan sumbu tengah nol (0.00 = rata-rata baseline nasional). Batang berwarna merah yang memanjang ke kanan (+0.01 hingga +1.00) menunjukkan indikator daerah yang lebih buruk dari rata-rata nasional sehingga mendorong kenaikan risiko stunting. Sebaliknya, batang berwarna hijau ke kiri (-0.01 hingga -1.00) menunjukkan indikator lokal yang sudah baik dan berperan sebagai faktor pelindung (buffer).",
      en: "The chart uses SHapley Additive exPlanations (TreeSHAP) centered on a zero axis (0.00 = national baseline). Red bars extending right (+0.01 to +1.00) denote local indicators performing worse than national benchmarks, driving stunting risk upward. Green bars extending left (-0.01 to -1.00) represent strong local indicators acting as protective buffers.",
    },
    badge: {
      id: "TreeSHAP Decomposition",
      en: "TreeSHAP Decomposition",
    },
  },
  {
    id: "faq-3",
    chipLabel: {
      id: "3. 12 Indikator Determinan",
      en: "3. 12 Determinant Indicators",
    },
    question: {
      id: "Apa saja 12 indikator determinan yang digunakan dalam model?",
      en: "Which 12 determinant indicators power the StuntWatch model?",
    },
    answer: {
      id: "Model menggabungkan determinan intervensi spesifik dan sensitif gizi di tingkat kabupaten/kota dan provinsi untuk menangkap akar masalah stunting secara menyeluruh dari aspek WASH, daya beli, pendidikan, hingga layanan kesehatan ibu-anak (1000 HPK).",
      en: "The model integrates both nutrition-specific and nutrition-sensitive determinants across district and provincial levels to capture the root causes of stunting across WASH, purchasing power, education, and maternal-child healthcare (first 1,000 days).",
    },
    badge: {
      id: "12 Variabel Multisektoral",
      en: "12 Multisectoral Variables",
    },
  },
  {
    id: "faq-4",
    chipLabel: {
      id: "4. Arsitektur Data & Integrasi API",
      en: "4. Data Architecture & API Integration",
    },
    question: {
      id: "Bagaimana arsitektur data dan integrasi API StuntWatch bekerja?",
      en: "How does StuntWatch's live data architecture and API integration work?",
    },
    answer: {
      id: "StuntWatch terhubung secara real-time ke backend analitik spasial melalui 6 endpoint utama (/api/provinces, /api/top-risky, /api/map-data, /api/provinsi/{slug}/summary, /api/provinsi/{slug}, serta /api/kabupaten/{id} dan /narrative). Batas administratif menggunakan geometri poligon resmi 38 Provinsi dan 514 Kabupaten/Kota berstandar kode wilayah BPS (CRS EPSG:4326) yang dipadukan dengan sintesis kebijakan otomatis berbasis Together AI.",
      en: "StuntWatch connects in real time to our spatial analytics backend via 6 core endpoints (/api/provinces, /api/top-risky, /api/map-data, /api/provinsi/{slug}/summary, /api/provinsi/{slug}, and /api/kabupaten/{id} + /narrative). Administrative boundaries use official 38-Province and 514-District BPS polygon geometries (CRS EPSG:4326) paired with automated Together AI policy brief synthesis.",
    },
    badge: {
      id: "Live REST API + EPSG:4326",
      en: "Live REST API + EPSG:4326",
    },
  },
  {
    id: "faq-5",
    chipLabel: {
      id: "5. Aktual SSGI vs Prediksi Proxy",
      en: "5. SSGI Actual vs Proxy Prediction",
    },
    question: {
      id: "Mengapa beberapa wilayah memiliki label ⚠️ Prediksi Risiko (Provinsi Proxy)?",
      en: "Why do some districts display the ⚠️ Predicted Risk (Province Proxy) badge?",
    },
    answer: {
      id: "Demi transparansi dan keadilan data (Data Equity), kabupaten/kota yang belum memiliki kelengkapan mikrodata lokal SUSENAS/WASH ditandai secara eksplisit dengan badge '⚠️ Proxy Provinsi' karena model menggunakan rata-rata indikator provinsi sebagai estimasi. Tabel peringkat daerah selalu diurutkan berdasarkan angka Aktual SSGI (%) tertinggi secara default agar wilayah dengan beban stunting nyata tetap menjadi prioritas utama intervensi.",
      en: "To uphold Data Equity and transparency, districts where local SUSENAS/WASH microdata are incomplete fall back to provincial averages and are explicitly flagged with '⚠️ Province Proxy'. District rankings always sort by SSGI Actual (%) descending by default so high-burden communities remain the top intervention priority.",
    },
    badge: {
      id: "Data Equity & Proxy Transparency",
      en: "Data Equity & Proxy Transparency",
    },
  },
  {
    id: "faq-6",
    chipLabel: {
      id: "6. Validasi & Etika Data",
      en: "6. Model Validation & Data Ethics",
    },
    question: {
      id: "Bagaimana validasi model, akurasi (MAE), dan etika tata kelola data diterapkan?",
      en: "How are model validation, accuracy (MAE), and data governance ethics enforced?",
    },
    answer: {
      id: "Model dievaluasi menggunakan validasi silang (Cross-Validation Mean Absolute Error / MAE) pada tingkat nasional dan provinsi untuk memantau deviasi antara prediksi berbasis determinan dan angka survei aktual. Seluruh data bersifat agregat tingkat wilayah administratif (tanpa data pribadi/individu) untuk mendukung perencanaan alokasi anggaran daerah yang objektif dan bebas stigma.",
      en: "The model is evaluated using cross-validated Mean Absolute Error (MAE) at both national and provincial levels to monitor deviation between determinant-based predictions and actual survey prevalence. All datasets are strictly aggregated at the administrative region level (zero personally identifiable information) to support objective, non-stigmatizing regional budget allocation.",
    },
    badge: {
      id: "GradientBoosting + Governance",
      en: "GradientBoosting + Governance",
    },
  },
];

const DETERMINANT_INDICATORS = {
  id: [
    "1. Akses Sanitasi Layak (%)",
    "2. Akses Air Minum Layak (%)",
    "3. Tingkat Kemiskinan Daerah (%)",
    "4. Cakupan ASI Eksklusif (%)",
    "5. Prevalensi Anemia Ibu Hamil (%)",
    "6. Kunjungan Antenatal Lengkap (ANC K6)",
    "7. Imunisasi Dasar Lengkap (%)",
    "8. Prevalensi Berat Badan Lahir Rendah (BBLR)",
    "9. Keragaman Pangan MP-ASI (MDD)",
    "10. Rata-rata Lama Sekolah Perempuan (RLS)",
    "11. Indeks Pembangunan Manusia (IPM)",
    "12. Pengeluaran per Kapita Disesuaikan (Rp)",
  ],
  en: [
    "1. Improved Sanitation Access (%)",
    "2. Clean Drinking Water Access (%)",
    "3. Regional Poverty Rate (%)",
    "4. Exclusive Breastfeeding Coverage (%)",
    "5. Maternal Anemia Prevalence (%)",
    "6. Complete Antenatal Care (ANC K6)",
    "7. Basic Child Immunization Coverage (%)",
    "8. Low Birth Weight Prevalence (LBW)",
    "9. Minimum Dietary Diversity (MDD)",
    "10. Female Mean Years of Schooling (MYS)",
    "11. Human Development Index (HDI)",
    "12. Adjusted Per-Capita Expenditure (IDR)",
  ],
};

export default function FaqPage() {
  const { locale } = useAppLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  // Item #1 (`faq-1`) is OPEN by default on initial load
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "faq-1": true,
  });

  const handleToggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectTopicChip = (topicId: string | null) => {
    setSelectedTopic(topicId);
    if (topicId) {
      setOpenItems((prev) => ({ ...prev, [topicId]: true }));
      setTimeout(() => {
        const el = document.getElementById(topicId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 60);
    }
  };

  const filteredFaqItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQ_TOPICS.filter((item) => {
      if (!q) return true;
      return (
        item.question[locale].toLowerCase().includes(q) ||
        item.answer[locale].toLowerCase().includes(q) ||
        item.chipLabel[locale].toLowerCase().includes(q)
      );
    });
  }, [searchQuery, locale]);

  const isSearching = searchQuery.trim().length > 2;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-slate-50 dark:bg-[#0a0e18] text-slate-800 dark:text-slate-100">
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10">
        {/* 1. TOP SUB-BAR: Breadcrumb & Live Sync Status */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/maps"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141926] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-[#1c2232] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {locale === "id"
                ? "Kembali ke Peta Nasional"
                : "Back to National Map"}
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141926] px-3.5 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400 shadow-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {locale === "id" ? "Edisi 2025.1" : "Edition 2025.1"}
            </span>
            <span>•</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {locale === "id"
                ? "Data Terintegrasi BPS & SKI"
                : "Integrated BPS & SKI Data"}
            </span>
          </div>
        </div>

        {/* 2. HERO HEADER & 3-COLUMN FEATURE HIGHLIGHT ROW */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>
              {locale === "id"
                ? "DOKUMENTASI & METODOLOGI"
                : "METHODOLOGY & DOCUMENTATION"}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {locale === "id"
              ? "Pertanyaan Umum (FAQ) & Metodologi StuntWatch"
              : "StuntWatch Frequently Asked Questions (FAQ) & Methodology"}
          </h1>

          <p className="mt-2.5 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {locale === "id"
              ? "Panduan teknis, metodologi pemodelan risiko stunting terintegrasi, dan arsitektur data nasional untuk transparansi pengawasan kesehatan publik."
              : "Technical guide, integrated stunting risk modeling methodology, and national data architecture for public health surveillance transparency."}
          </p>

          {/* 3-Column Feature Highlight Row */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Highlight 1 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#141926] p-5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  38 Provinsi &amp; 514 Kab/Kota
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {locale === "id"
                    ? "Cakupan penuh kode wilayah BPS seluruh Indonesia termasuk pemekaran Papua."
                    : "Full BPS administrative coverage across Indonesia including all 6 Papua provinces."}
                </p>
              </div>
            </div>

            {/* Highlight 2 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#141926] p-5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  SHAP Factor Decomposition
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {locale === "id"
                    ? "Kuantifikasi faktor pendorong risiko (+) dan faktor pelindung (-) secara transparan."
                    : "Transparent quantification of risk-increasing (+) and protective (-) drivers."}
                </p>
              </div>
            </div>

            {/* Highlight 3 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#141926] p-5 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  WCAG AA Accessible
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {locale === "id"
                    ? "Mendukung navigasi keyboard penuh, pembaca layar, serta mode Terang dan Gelap."
                    : "Supports full keyboard navigation, screen readers, and high-contrast Light/Dark modes."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FULL-WIDTH SEARCH & QUICK-TOPIC FILTER CARD */}
        <section
          aria-label={
            locale === "id"
              ? "Pencarian dan Filter Topik FAQ"
              : "FAQ Search and Topic Filter"
          }
          className="mb-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141926] p-5 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {locale === "id"
                ? "Pencarian & Filter Topik"
                : "Search & Topic Filter"}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {locale === "id"
                ? "6 Topik Utama Tersedia"
                : "6 Core Topics Available"}
            </span>
          </div>

          {/* Full-Width Search Input */}
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === "id"
                  ? "Cari pertanyaan, parameter determinan, atau topik metodologi..."
                  : "Search questions, determinant parameters, or methodology topics..."
              }
              aria-label={
                locale === "id"
                  ? "Cari pertanyaan, parameter determinan, atau topik metodologi"
                  : "Search questions, determinant parameters, or methodology topics"
              }
              className="h-11 w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0d121d] pl-10 pr-9 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Horizontal Row of Clickable Quick-Topic Filter Chips */}
          <div
            role="group"
            aria-label={
              locale === "id" ? "Filter topik cepat" : "Quick topic filters"
            }
            className="mt-3.5 flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              onClick={() => handleSelectTopicChip(null)}
              aria-pressed={selectedTopic === null}
              className={`rounded-xl border px-3 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                selectedTopic === null
                  ? "border-transparent bg-teal-600 dark:bg-[#14b8a6] font-semibold text-white dark:text-slate-950 shadow-sm"
                  : "border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#1c2232] text-slate-600 dark:text-slate-300 hover:border-teal-500/50"
              }`}
            >
              {locale === "id" ? "Semua Topik" : "All Topics"}
            </button>

            {FAQ_TOPICS.map((topic) => {
              const isActive = selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelectTopicChip(topic.id)}
                  aria-pressed={isActive}
                  className={`rounded-xl border px-3 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                    isActive
                      ? "border-transparent bg-teal-600 dark:bg-[#14b8a6] font-semibold text-white dark:text-slate-950 shadow-sm"
                      : "border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#1c2232] text-slate-600 dark:text-slate-300 hover:border-teal-500/50"
                  }`}
                >
                  {topic.chipLabel[locale]}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. FULL-WIDTH VERTICAL STACK OF 6 FAQ ACCORDION CARDS */}
        <section
          aria-label={
            locale === "id"
              ? "Daftar Pertanyaan Umum dan Metodologi"
              : "Frequently Asked Questions and Methodology List"
          }
          className="space-y-3.5"
        >
          {filteredFaqItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#141926] p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {locale === "id"
                ? `Tidak ada topik FAQ yang cocok dengan pencarian "${searchQuery}".`
                : `No FAQ topics matched your search "${searchQuery}".`}
            </div>
          ) : (
            filteredFaqItems.map((item, idx) => {
              const isOpen =
                isSearching ||
                selectedTopic === item.id ||
                Boolean(openItems[item.id]);

              return (
                <article
                  key={item.id}
                  id={item.id}
                  className={`scroll-mt-24 overflow-hidden rounded-2xl border transition-all ${
                    selectedTopic === item.id
                      ? "border-teal-500/60 bg-white dark:bg-[#141926] shadow-md"
                      : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141926] shadow-sm"
                  }`}
                >
                  {/* Accordion Header Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleItem(item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50/70 dark:hover:bg-[#1c2232]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                        {idx + 1}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                        {item.question[locale]}
                      </h2>
                      {item.badge && (
                        <span className="rounded-full border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#1c2232] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {item.badge[locale]}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1c2232] text-slate-600 dark:text-slate-300">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>

                  {/* Accordion Body Content */}
                  {isOpen && (
                    <div className="border-t border-slate-200/80 dark:border-white/[0.08] px-5 pb-5 pt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 space-y-4">
                      <p>{item.answer[locale]}</p>

                      {/* Extra Content for FAQ #1: 4-Column Risk Tier Grid */}
                      {item.id === "faq-1" && (
                        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                                {locale === "id" ? "Rendah" : "Low Risk"}
                              </span>
                            </div>
                            <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                              Skor: 0 – 24
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                              {locale === "id"
                                ? "Kerentanan terkendali; pertahankan layanan dasar."
                                : "Controlled vulnerability; maintain baseline services."}
                            </p>
                          </div>

                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                {locale === "id" ? "Sedang" : "Moderate Risk"}
                              </span>
                            </div>
                            <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                              Skor: 25 – 49
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                              {locale === "id"
                                ? "Perlu penguatan intervensi sensitif & WASH."
                                : "Requires targeted nutrition-sensitive & WASH upgrades."}
                            </p>
                          </div>

                          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                              <span className="text-xs font-bold text-orange-900 dark:text-orange-300">
                                {locale === "id" ? "Tinggi" : "High Risk"}
                              </span>
                            </div>
                            <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                              Skor: 50 – 74
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                              {locale === "id"
                                ? "Prioritas intervensi multisektoral terpadu."
                                : "Priority for integrated multisectoral intervention."}
                            </p>
                          </div>

                          <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                                {locale === "id"
                                  ? "Sangat Tinggi"
                                  : "Very High Risk"}
                              </span>
                            </div>
                            <p className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                              Skor: 75 – 100
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                              {locale === "id"
                                ? "Zona kritis percepatan penurunan stunting."
                                : "Critical zone requiring urgent stunting acceleration."}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Extra Content for FAQ #2: Diverging SHAP Baseline Visual Bar */}
                      {item.id === "faq-2" && (
                        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0d121d] p-4">
                          <div className="flex items-center justify-between font-mono text-[11px] font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ← −1.00{" "}
                              {locale === "id"
                                ? "Faktor Pelindung (Hijau)"
                                : "Protective Buffer (Green)"}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              0.00 Baseline Nasional
                            </span>
                            <span className="text-rose-600 dark:text-rose-400">
                              +1.00{" "}
                              {locale === "id"
                                ? "Meningkatkan Risiko (Merah)"
                                : "Risk Driver (Red)"}{" "}
                              →
                            </span>
                          </div>
                          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full border border-slate-200 dark:border-white/[0.08]">
                            <div className="h-full w-1/2 bg-gradient-to-r from-emerald-500 to-emerald-500/20" />
                            <div className="h-full w-0.5 bg-slate-900 dark:bg-white" />
                            <div className="h-full w-1/2 bg-gradient-to-r from-rose-500/20 to-rose-500" />
                          </div>
                        </div>
                      )}

                      {/* Extra Content for FAQ #3: 12 Determinant Indicator Chips */}
                      {item.id === "faq-3" && (
                        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                          {DETERMINANT_INDICATORS[locale].map((ind) => (
                            <div
                              key={ind}
                              className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0d121d] px-3 py-2 font-mono text-xs font-medium text-slate-700 dark:text-slate-200"
                            >
                              {ind}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* 5. BOTTOM HELP-DESK CALLOUT BANNER */}
        <section
          aria-label={
            locale === "id"
              ? "Bantuan Teknis dan Sekretariat"
              : "Technical Help Desk and Secretariat"
          }
          className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-teal-200/80 dark:border-teal-500/25 bg-teal-50/60 dark:bg-[#111927] p-5 sm:flex-row sm:items-center"
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-400">
              <HelpCircle className="h-4 w-4" />
              <span>
                {locale === "id"
                  ? "Punya pertanyaan spesifik?"
                  : "Have a specific technical question?"}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {locale === "id"
                ? "Tim metodologi data dan pengembang epidemiologi kami siap memberikan klarifikasi teknis."
                : "Our data methodology and spatial epidemiology engineering team is ready to assist."}
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-[#14b8a6] dark:hover:bg-[#29a195] px-4 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-slate-950 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <span>
              {locale === "id"
                ? "Hubungi Tim Pengembang & Sekretariat"
                : "Contact Engineering & Secretariat"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      {/* 6. BOTTOM INSTITUTIONAL FOOTER */}
      <footer className="mt-12 w-full border-t border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0a0e18] px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 md:flex-row">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-teal-700 dark:text-[#4fdbc8]">
              StuntWatch
            </span>
            <span>•</span>
            <span>
              {locale === "id"
                ? "© 2025 StuntWatch Indonesia. Sistem Pendukung Keputusan Spasial Nasional."
                : "© 2025 StuntWatch Indonesia. National Spatial Decision Support System."}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium">
            <Link
              href="/faq"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {locale === "id" ? "Kebijakan Privasi" : "Privacy Policy"}
            </Link>
            <Link
              href="/faq"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {locale === "id" ? "Ketentuan Layanan" : "Terms of Service"}
            </Link>
            <Link
              href="/maps"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {locale === "id" ? "Pusat Data Kesehatan" : "Health Data Center"}
            </Link>
            <Link
              href="/contact"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {locale === "id"
                ? "Kementerian Kesehatan RI"
                : "Ministry of Health RI"}
            </Link>
            <Link
              href="/faq"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
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
