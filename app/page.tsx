"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Map, ArrowRight, Layers, BarChart2, ShieldCheck } from "lucide-react";

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
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-rose-600 dark:bg-rose-400" />
          {t("badge")}
        </span>

        {/* Row 2: Hero Title (Col-span-12) */}
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-3">
          {t("title")}
        </h1>
        <p className="text-lg font-semibold text-rose-600 dark:text-rose-400 sm:text-xl mb-6">
          {t("subtitle")}
        </p>

        {/* Row 3: Explanation Block (max-w-2xl, centered prose) */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed mb-9">
          {t("description")}
        </p>

        {/* Row 4: Primary CTA Button (Routes to /maps) */}
        <Link
          href="/maps"
          className="group inline-flex items-center gap-3 rounded-full bg-foreground px-10 py-4 text-lg font-semibold text-background shadow-md transition-all hover:scale-[1.02] hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <Layers className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>{t("statsProvinces")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-3 text-xs font-semibold text-foreground shadow-sm">
            <BarChart2 className="h-4 w-4 text-amber-500" />
            <span>{t("statsDistricts")}</span>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-3 text-xs font-semibold text-foreground shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>{t("statsIndicators")}</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
