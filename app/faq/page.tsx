"use client";

import React from "react";
import Link from "next/link";
import { useAppLocale } from "@/lib/i18n";
import { HelpCircle, ArrowLeft, Layers, Cpu, ShieldAlert } from "lucide-react";

const FAQ_ITEMS = {
  id: [
    {
      q: "Apa itu Indeks Risiko Stunting StuntWatch (0–100)?",
      a: "Indeks Risiko StuntWatch adalah skor komposit ternormalisasi (0 hingga 100) yang memodelkan kerentanan struktural suatu provinsi atau kabupaten/kota terhadap kejadian stunting balita. Skor 0–24 dikategorikan Rendah, 25–49 Sedang, 50–74 Tinggi, dan 75–100 Sangat Tinggi.",
    },
    {
      q: "Bagaimana cara membaca Grafik Kontribusi Faktor (SHAP)?",
      a: "Grafik kontribusi faktor mengadopsi pendekatan SHapley Additive exPlanations (SHAP) dengan sumbu tengah nol (0). Batang berwarna merah yang memanjang ke kanan (+0.01 hingga +1.00) menunjukkan indikator daerah yang lebih buruk dari rata-rata nasional sehingga mendorong kenaikan risiko stunting. Sebaliknya, batang berwarna hijau ke kiri (-0.01 hingga -1.00) menunjukkan indikator yang sudah baik dan berperan sebagai faktor pelindung.",
    },
    {
      q: "Apa saja 12 indikator determinan yang digunakan dalam model?",
      a: "Model menggabungkan determinan spesifik dan sensitif gizi: (1) Akses Sanitasi Layak, (2) Akses Air Minum Layak, (3) Tingkat Kemiskinan, (4) Cakupan ASI Eksklusif, (5) Prevalensi Anemia Ibu Hamil, (6) Kunjungan Antenatal Lengkap (ANC K6), (7) Imunisasi Dasar Lengkap, (8) Prevalensi BBLR, (9) Keragaman Pangan MP-ASI (MDD), (10) Pendidikan Ibu, (11) Perkawinan Usia Anak, dan (12) Ketidakcukupan Konsumsi Pangan (PoU).",
    },
    {
      q: "Bagaimana arsitektur data ini dihubungkan ke API produksi nantinya?",
      a: "StuntWatch dirancang dengan pola Mock Adapter terisolasi di direktori lib/api/mockAdapter.ts. Seluruh komponen antarmuka pengguna hanya memanggil React Query hooks (useProvinces, useKabKota, useExplanation). Saat API produksi Kemenkes/BKKBN/BPS siap, tim pengembang cukup mengganti fungsi fetch di satu berkas adapter tanpa mengubah kode komponen UI.",
    },
  ],
  en: [
    {
      q: "What is the StuntWatch Stunting Risk Index (0–100)?",
      a: "The StuntWatch Risk Index is a normalized composite score (0 to 100) modeling a province or district's structural vulnerability to childhood stunting. Scores 0–24 represent Low risk, 25–49 Moderate, 50–74 High, and 75–100 Very High risk.",
    },
    {
      q: "How do I interpret the Factor Contribution (SHAP) Chart?",
      a: "The chart uses SHapley Additive exPlanations (SHAP) centered on a zero axis. Red bars extending right (+0.01 to +1.00) denote local indicators performing worse than national benchmarks, driving stunting risk upward. Green bars extending left (-0.01 to -1.00) represent strong local indicators acting as protective buffers.",
    },
    {
      q: "Which 12 determinant indicators power the model?",
      a: "The model integrates both nutrition-specific and nutrition-sensitive determinants: (1) Improved Sanitation Access, (2) Clean Drinking Water Access, (3) Poverty Rate, (4) Exclusive Breastfeeding, (5) Maternal Anemia, (6) Complete Antenatal Care (ANC K6), (7) Basic Child Immunization, (8) Low Birth Weight (LBW), (9) Minimum Dietary Diversity, (10) Maternal Secondary Education, (11) Child/Early Marriage Rate, and (12) Food Insecurity Prevalence (PoU).",
    },
    {
      q: "How does the decoupled Mock Adapter architecture transition to live APIs?",
      a: "All UI components consume typed TanStack Query hooks (useProvinces, useKabKota, useExplanation) backed by lib/api/mockAdapter.ts. Engineering teams can connect live production endpoints and high-resolution BPS TopoJSON boundary files by updating only lib/api/mockAdapter.ts and public/geo/ with zero UI changes.",
    },
  ],
};

export default function FaqPage() {
  const { locale } = useAppLocale();
  const items = FAQ_ITEMS[locale];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/maps"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>
          {locale === "id" ? "Kembali ke Peta Nasional" : "Back to National Map"}
        </span>
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
          <HelpCircle className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {locale === "id"
              ? "Dokumentasi & Metodologi"
              : "Methodology & Documentation"}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {locale === "id"
            ? "Pertanyaan Umum (FAQ) & Metodologi StuntWatch"
            : "Frequently Asked Questions (FAQ) & Methodology"}
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <Layers className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <h2 className="mt-2 text-sm font-bold">38 Provinsi & 514 Kab/Kota</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {locale === "id"
                ? "Cakupan penuh kode wilayah BPS seluruh Indonesia termasuk pemekaran Papua."
                : "Full BPS administrative coverage across Indonesia including new Papua provinces."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <Cpu className="h-5 w-5 text-amber-500" />
            <h2 className="mt-2 text-sm font-bold">SHAP Factor Decomposition</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {locale === "id"
                ? "Kuantifikasi faktor pendorong risiko (+) dan faktor pelindung (-) secara transparan."
                : "Transparent quantification of risk-increasing (+) and protective (-) drivers."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <ShieldAlert className="h-5 w-5 text-emerald-500" />
            <h2 className="mt-2 text-sm font-bold">WCAG AA Accessible</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {locale === "id"
                ? "Mendukung navigasi keyboard penuh, pembaca layar, serta mode Terang dan Gelap."
                : "Full keyboard navigation, screen-reader directory, and Light/Dark theme parity."}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-background p-5"
            >
              <h3 className="text-base font-bold text-foreground">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
