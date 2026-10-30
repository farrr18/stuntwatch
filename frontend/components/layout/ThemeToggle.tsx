"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted/70 p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform duration-200 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-sky-400" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute flex w-full items-center justify-between px-1.5 text-muted-foreground`}
      >
        <Sun
          className={`h-3 w-3 transition-opacity ${
            isDark ? "opacity-50" : "opacity-0"
          }`}
        />
        <Moon
          className={`h-3 w-3 transition-opacity ${
            isDark ? "opacity-0" : "opacity-50"
          }`}
        />
      </span>
    </button>
  );
}
