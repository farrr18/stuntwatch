import { interpolateRdYlGn } from "d3-scale-chromatic";
import { scaleSequential } from "d3-scale";
import type { RiskLevel, Locale } from "./types";

/**
 * Single Source of Truth for StuntWatch Risk Colors & Semantic Tokens.
 * No component may hardcode hex or Tailwind risk colors outside this module.
 */

export interface RiskBandConfig {
  level: RiskLevel;
  min: number;
  max: number;
  label: Record<Locale, string>;
  hex: string;
  darkHex: string;
  badgeClass: string;
  borderClass: string;
  barClass: string;
  textClass: string;
  dotClass: string;
}

export const RISK_BANDS: Record<RiskLevel, RiskBandConfig> = {
  low: {
    level: "low",
    min: 0,
    max: 19.9,
    label: {
      id: "Rendah",
      en: "Low",
    },
    hex: "#10b981",
    darkHex: "#34d399",
    badgeClass:
      "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700/70",
    borderClass: "border-emerald-500 dark:border-emerald-400",
    barClass: "bg-emerald-500 dark:bg-emerald-400",
    textClass: "text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  moderate: {
    level: "moderate",
    min: 20,
    max: 29.9,
    label: {
      id: "Sedang",
      en: "Moderate",
    },
    hex: "#f59e0b",
    darkHex: "#fbbf24",
    badgeClass:
      "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700/70",
    borderClass: "border-amber-500 dark:border-amber-400",
    barClass: "bg-amber-500 dark:bg-amber-400",
    textClass: "text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  high: {
    level: "high",
    min: 30,
    max: 39.9,
    label: {
      id: "Tinggi",
      en: "High",
    },
    hex: "#f97316",
    darkHex: "#fb923c",
    badgeClass:
      "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200 dark:border-orange-700/70",
    borderClass: "border-orange-500 dark:border-orange-400",
    barClass: "bg-orange-500 dark:bg-orange-400",
    textClass: "text-orange-700 dark:text-orange-300",
    dotClass: "bg-orange-500",
  },
  very_high: {
    level: "very_high",
    min: 40,
    max: 100,
    label: {
      id: "Sangat Tinggi",
      en: "Very High",
    },
    hex: "#e11d48",
    darkHex: "#fb7185",
    badgeClass:
      "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700/70",
    borderClass: "border-rose-600 dark:border-rose-400",
    barClass: "bg-rose-600 dark:bg-rose-500",
    textClass: "text-rose-700 dark:text-rose-300",
    dotClass: "bg-rose-600",
  },
};

export const RISK_LEVEL_ORDER: RiskLevel[] = [
  "very_high",
  "high",
  "moderate",
  "low",
];

/**
 * Maps an API tier label ("Rendah", "Sedang", "Tinggi", "Sangat Tinggi") to RiskLevel.
 */
export function getRiskLevelFromTier(tier?: string): RiskLevel | null {
  if (!tier) return null;
  const normalized = tier.trim().toLowerCase();
  if (normalized === "sangat tinggi" || normalized === "very_high") {
    return "very_high";
  }
  if (normalized === "tinggi" || normalized === "high") {
    return "high";
  }
  if (normalized === "sedang" || normalized === "moderate") {
    return "moderate";
  }
  if (normalized === "rendah" || normalized === "low") {
    return "low";
  }
  return null;
}

/**
 * Maps a numeric prevalence/risk score to a discrete RiskLevel band.
 * Supports both WHO/SSGI Stunting Prevalence % (<20 Rendah, 20-29.9 Sedang, 30-39.9 Tinggi, >=40 Sangat Tinggi)
 * and 0-100 index scores.
 */
export function getRiskLevelFromScore(score: number, tier?: string): RiskLevel {
  const fromTier = getRiskLevelFromTier(tier);
  if (fromTier) return fromTier;

  if (score < 20) return "low";
  if (score < 30) return "moderate";
  if (score < 40) return "high";
  return "very_high";
}

/**
 * Continuous D3 color scale for map polygon fills.
 * Maps stunting prevalence / predicted risk (10% = Low Risk Emerald Green, 44% = Very High Risk Crimson)
 * using d3.interpolateRdYlGn(1 - t).
 */
const continuousScale = scaleSequential((t: number) =>
  interpolateRdYlGn(1 - Math.max(0.05, Math.min(0.96, t)))
).domain([12, 42]);

export function getMapFillColor(score: number): string {
  const clamped = Math.max(12, Math.min(42, score));
  return continuousScale(clamped);
}

/**
 * Returns the full RiskBandConfig for a given RiskLevel.
 */
export function getRiskBandConfig(level: RiskLevel): RiskBandConfig {
  return RISK_BANDS[level];
}

/**
 * Returns the localized label for a RiskLevel.
 */
export function getRiskLabel(level: RiskLevel, locale: Locale = "id"): string {
  return RISK_BANDS[level].label[locale];
}

/**
 * Returns semantic colors for SHAP factor contribution bars
 */
export function getContributionColor(
  contribution: number,
  isDark: boolean = false
): string {
  if (contribution > 0) {
    return isDark ? "#fb7185" : "#e11d48";
  }
  return isDark ? "#34d399" : "#10b981";
}

/**
 * Returns semantic pill styles for ComparisonTable status (better vs worse than avg)
 */
export function getComparisonStatusStyle(
  status: "better" | "worse" | "neutral"
): {
  badgeClass: string;
  label: Record<Locale, string>;
} {
  if (status === "worse") {
    return {
      badgeClass:
        "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700/70",
      label: {
        id: "Mendorong Risiko (+)",
        en: "Increases Risk (+)",
      },
    };
  }
  if (status === "better") {
    return {
      badgeClass:
        "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700/70",
      label: {
        id: "Faktor Pelindung (-)",
        en: "Protective (-)",
      },
    };
  }
  return {
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    label: {
      id: "Netral",
      en: "Neutral",
    },
  };
}

/**
 * CSS linear-gradient string for the continuous MapLegend
 */
export function getLegendGradientCSS(): string {
  const stops: string[] = [];
  for (let i = 0; i <= 100; i += 10) {
    const val = 12 + (i / 100) * 30;
    stops.push(`${getMapFillColor(val)} ${i}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/**
 * Formats an indicator value according to its unit or identifier.
 * For per-capita expenditure ("IDR", "Rp", or "pengeluaran_kab"), multiplies raw
 * "ribu rupiah" values (< 1,000,000) by 1,000 and formats as `Rp. 11.168.000`.
 */
export function formatIndicatorValue(
  value: number | null | undefined,
  unit: string,
  fallbackText: string = "Proxy",
  idOrRawName?: string
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return fallbackText;
  }
  const num = Number(value);
  const isIdr =
    unit === "IDR" ||
    unit.includes("Rp") ||
    Boolean(idOrRawName && idOrRawName.includes("pengeluaran"));

  if (isIdr) {
    const rupiahAmount = num > 0 && num < 1_000_000 ? num * 1000 : num;
    const formatted = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(Math.round(rupiahAmount));
    return `Rp. ${formatted}`;
  }

  return `${num}${unit}`;
}

