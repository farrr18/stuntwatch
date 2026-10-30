"use client";

import React from "react";
import { useAppLocale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale } = useAppLocale();

  return (
    <div
      role="group"
      aria-label="Language selector"
      className="inline-flex items-center rounded-full border border-border bg-muted/60 p-0.5 text-xs font-semibold"
    >
      <button
        type="button"
        onClick={() => setLocale("id")}
        aria-pressed={locale === "id"}
        className={`rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          locale === "id"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          locale === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
