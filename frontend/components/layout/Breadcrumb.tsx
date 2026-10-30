"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";

interface BreadcrumbProps {
  provinceName: string;
  provinceId: string;
  kabKotaName?: string;
}

export function Breadcrumb({
  provinceName,
  provinceId,
  kabKotaName,
}: BreadcrumbProps) {
  const t = useTranslations("province");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/maps"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("backToNational")}</span>
        </Link>

        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 pl-1 text-sm"
        >
          <Link
            href="/maps"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("indonesia")}
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Link
            href={`/provinsi/${provinceId}`}
            className={`font-medium transition-colors hover:text-foreground ${
              kabKotaName ? "text-muted-foreground" : "text-foreground font-semibold"
            }`}
          >
            {provinceName}
          </Link>
          {kabKotaName && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <MapPin className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                {kabKotaName}
              </span>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
