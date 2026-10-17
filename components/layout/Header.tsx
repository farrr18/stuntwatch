"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Activity } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const t = useTranslations("ribbon");

  const isMapsActive =
    pathname === "/maps" || pathname.startsWith("/provinsi");
  const isFaqActive = pathname === "/faq";
  const isContactActive = pathname === "/contact";

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Col 1: Brand */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm dark:bg-rose-500">
            <Activity className="h-4 w-4" />
          </span>
          <span>{t("brand")}</span>
        </Link>

        {/* Col 2: Navigation & Controls */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav
            aria-label="Global navigation"
            className="flex items-center gap-3 sm:gap-6 text-sm font-medium"
          >
            <Link
              href="/maps"
              className={`relative py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${
                isMapsActive
                  ? "font-semibold text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-rose-600 dark:after:bg-rose-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("home")}
            </Link>
            <Link
              href="/faq"
              className={`relative py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${
                isFaqActive
                  ? "font-semibold text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-rose-600 dark:after:bg-rose-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("faq")}
            </Link>
            <Link
              href="/contact"
              className={`relative py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${
                isContactActive
                  ? "font-semibold text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-rose-600 dark:after:bg-rose-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("contact")}
            </Link>
          </nav>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
