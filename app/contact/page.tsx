"use client";

import React from "react";
import Link from "next/link";
import { useAppLocale } from "@/lib/i18n";
import { Mail, Building2, Globe, ArrowLeft, FileSpreadsheet } from "lucide-react";

export default function ContactPage() {
  const { locale } = useAppLocale();

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
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          {locale === "id"
            ? "Koordinasi & Integrasi Data"
            : "Institutional Contact & Data Integration"}
        </span>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {locale === "id"
            ? "Hubungi Tim Pengembang & Sekretariat StuntWatch"
            : "Contact StuntWatch Secretariat & Engineering Team"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {locale === "id"
            ? "Untuk integrasi API e-PPGBM, pembaruan batas wilayah TopoJSON BPS terbaru, atau kolaborasi perencanaan intervensi daerah (Bappeda/Dinkes/BKKBN)."
            : "For live e-PPGBM API integration, updated official BPS TopoJSON boundary files, or regional planning collaboration."}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-5">
            <Building2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <h2 className="mt-3 text-base font-bold text-foreground">
              {locale === "id"
                ? "Sekretariat Percepatan Penurunan Stunting"
                : "National Stunting Reduction Secretariat"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Jl. Medan Merdeka Barat, Jakarta Pusat 10110, Indonesia
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-5">
            <Mail className="h-5 w-5 text-amber-500" />
            <h2 className="mt-3 text-base font-bold text-foreground">
              {locale === "id"
                ? "Dukungan Teknis & Integrasi Data"
                : "Technical & Data Adapter Support"}
            </h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              data-integration@stuntwatch.id
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-5">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            <h2 className="mt-3 text-base font-bold text-foreground">
              {locale === "id"
                ? "Spesifikasi Kontrak Data (Mock Adapter)"
                : "Data Contract Specification (Mock Adapter)"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {locale === "id"
                ? "Lihat berkas lib/types.ts dan lib/api/mockAdapter.ts untuk skema JSON 38 provinsi dan 514 kabupaten/kota."
                : "Refer to lib/types.ts and lib/api/mockAdapter.ts for the 38-province and 514-district JSON schemas."}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-5">
            <Globe className="h-5 w-5 text-sky-500" />
            <h2 className="mt-3 text-base font-bold text-foreground">
              {locale === "id"
                ? "Portal Referensi Nasional"
                : "Official Reference Portals"}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              stunting.go.id · bps.go.id · kemkes.go.id
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
