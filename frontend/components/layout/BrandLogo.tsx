"use client";

import React from "react";

interface BrandLogoProps {
  variant?: "full" | "ribbon";
  className?: string;
}

/**
 * Custom Medical Typographic SVG Logo for StuntWatch:
 * - "Stun" + vertical stem/base of "t" in Medical Navy (#132A4A light / #F8FAFC dark)
 * - Crossbar of "t" as a Red Medical Cross (#D9463E / dark:fill-red-400) with a white ECG heartbeat line inside
 * - "Watch" in Health Teal (#159A7C light / #2DD4BF dark) with a red ECG pulse wave at the top-right of "h"
 * - Supports variant="full" (with subtitle "Peta Risiko Stunting Indonesia") and variant="ribbon"
 */
export function BrandLogo({
  variant = "ribbon",
  className = "",
}: BrandLogoProps) {
  const isFull = variant === "full";

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      aria-label="StuntWatch — Peta Risiko Stunting Indonesia"
    >
      <div
        className={`inline-flex items-baseline font-extrabold tracking-tight leading-none ${
          isFull ? "text-5xl sm:text-7xl" : "text-xl sm:text-2xl"
        }`}
      >
        {/* "Stun" in Medical Navy (#132A4A light / #F8FAFC dark) */}
        <span className="text-[#132A4A] dark:text-[#F8FAFC]">Stun</span>

        {/* Custom SVG "t" with Medical Navy stem + Red Medical Crossbar (#D9463E / dark:fill-red-400) & White ECG heartbeat line */}
        <span
          className={`relative inline-flex items-center justify-center ${
            isFull
              ? "mx-0.5 h-[52px] w-[36px] sm:h-[68px] sm:w-[46px] translate-y-[3px]"
              : "mx-[1px] h-[22px] w-[16px] translate-y-[1.5px]"
          }`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 46 68"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full overflow-visible"
          >
            {/* Base/stem of 't' in Medical Navy (#132A4A light / #F8FAFC dark) */}
            <path
              d="M18 6C18 3.79086 19.7909 2 22 2H24C26.2091 2 28 3.79086 28 6V52C28 55.866 30.6 58 34.5 58C36.2 58 37.8 57.6 39 57.1V64.5C37.2 65.4 34.4 66 31.5 66C23.2 66 18 61.2 18 52.5V6Z"
              className="fill-[#132A4A] dark:fill-[#F8FAFC]"
            />

            {/* Red Medical Crossbar of 't' (#D9463E / dark:fill-red-400) */}
            <rect
              x="1"
              y="18"
              width="44"
              height="15"
              rx="4"
              className="fill-[#D9463E] dark:fill-red-400"
            />
            {/* Vertical medical cross accent on the 't' intersection */}
            <rect
              x="16.5"
              y="11"
              width="13"
              height="29"
              rx="3.5"
              className="fill-[#D9463E] dark:fill-red-400"
            />

            {/* White ECG heartbeat line inside the Red Medical Crossbar */}
            <path
              d="M4 25.5H13L16 20L19.5 31L23 16.5L26.5 29.5L29.5 23.5L32 25.5H42"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {/* "Watch" in Health Teal (#159A7C light / #2DD4BF dark) */}
        <span className="relative inline-flex items-baseline text-[#159A7C] dark:text-[#2DD4BF]">
          <span>Watc</span>
          <span className="relative inline-block">
            h
            {/* Small Red ECG Pulse Wave at the top-right of "h" */}
            <svg
              viewBox="0 0 38 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className={
                isFull
                  ? "pointer-events-none absolute -right-7 -top-2 h-5 w-9 sm:-right-9 sm:-top-2.5 sm:h-6 sm:w-11"
                  : "pointer-events-none absolute -right-4 -top-1 h-2.5 w-4.5"
              }
            >
              <path
                d="M1 10H9L12.5 3L16.5 15.5L20.5 2L24.5 13L27.5 8.5L30 10H36"
                className="stroke-[#D9463E] dark:stroke-red-400"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="36"
                cy="10"
                r="2.2"
                className="fill-[#D9463E] dark:fill-red-400"
              />
            </svg>
          </span>
        </span>
      </div>

      {/* Subtitle for variant="full" */}
      {isFull && (
        <p className="mt-3 text-base font-bold tracking-wide text-[#132A4A]/85 dark:text-[#F8FAFC]/85 sm:text-xl">
          Peta Risiko Stunting Indonesia
        </p>
      )}
    </div>
  );
}
