"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Map, ArrowRight, Layers, BarChart2, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex max-w-3xl flex-col items-center"
      >
        {/* Subtle System Badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#D9463E]" />
          {t("badge")}
        </span>

        {/* Row 2: Hero BrandLogo (variant="full" includes subtitle "Peta Risiko Stunting Indonesia") */}
        <div className="mb-7">
          <BrandLogo variant="full" />
        </div>

        {/* Row 3: Explanation Block (max-w-2xl, centered prose) */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed mb-9">
          {t("description")}
        </p>

        {/* Row 4: Primary CTA Button (Routes to /maps) */}
        <Link
          href="/maps"
          className="group inline-flex items-center gap-3 rounded-full bg-[#132A4A] dark:bg-[#159A7C] px-10 py-4 text-lg font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#D9463E] dark:hover:bg-[#D9463E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Map className="h-5 w-5" />
          <span>{t("cta")}</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <span className="mt-2.5 text-xs text-muted-foreground">
          {t("ctaSub")}
        </span>

        {/* Compact Key Coverage Pills */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3 w-full max-w-xl">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-3 text-xs font-semibold text-foreground shadow-sm">
            <Layers className="h-4 w-4 text-[#D9463E]" />
            <span>{t("statsProvinces")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-3 text-xs font-semibold text-foreground shadow-sm">
            <BarChart2 className="h-4 w-4 text-[#159A7C] dark:text-[#2DD4BF]" />
            <span>{t("statsDistricts")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-3 text-xs font-semibold text-foreground shadow-sm">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span>{t("statsIndicators")}</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
