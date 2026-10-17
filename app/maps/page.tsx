"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  useProvinces,
  useTopRiskyDistricts,
} from "@/lib/hooks/useStuntingData";
import { IndonesiaMap } from "@/components/map/IndonesiaMap";
import { NationalSideDrawer } from "@/components/national/NationalSideDrawer";

export default function NationalMapsPage() {
  // Live Endpoint 1: GET /api/provinces
  const { data: provinces, isLoading: isLoadingProvinces } = useProvinces();
  // Live Endpoint 2: GET /api/top-risky?n=15
  const { data: topRiskyDistricts, isLoading: isLoadingWatchlist } =
    useTopRiskyDistricts(15);

  const workspaceRef = useRef<HTMLElement | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIslandGroup, setSelectedIslandGroup] = useState<string>("ALL");
  const [flyToTarget, setFlyToTarget] = useState<{
    type: "province" | "district";
    id: string;
    timestamp: number;
  } | null>(null);

  // Sync native Fullscreen API state if exited via Esc key
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    if (!workspaceRef.current) return;
    try {
      if (!document.fullscreenElement && !isFullscreen) {
        if (workspaceRef.current.requestFullscreen) {
          await workspaceRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to fixed viewport fullscreen mode if browser blocks native Fullscreen API
      setIsFullscreen((prev) => !prev);
    }
  };

  const filteredProvinces = useMemo(() => {
    if (!provinces) return [];
    const q = searchQuery.trim().toLowerCase();
    return provinces.filter((p) => {
      const matchesIsland =
        selectedIslandGroup === "ALL" || p.islandGroup === selectedIslandGroup;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.highest_risk_kabupaten.toLowerCase().includes(q) ||
        p.islandGroup.toLowerCase().includes(q);
      return matchesIsland && matchesQuery;
    });
  }, [provinces, searchQuery, selectedIslandGroup]);

  if (isLoadingProvinces || !provinces) {
    return (
      <main className="flex h-[calc(100vh-4rem)] min-h-[600px] w-full items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Loading 38-Province Live StuntWatch Map Workspace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={workspaceRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-background"
          : "relative flex h-[calc(100vh-4rem)] min-h-[600px] w-full overflow-hidden bg-background"
      }
    >
      {/* HERO MAP WORKSPACE (65%-75% width when drawer open, 100% width when collapsed) */}
      <section
        aria-label="Interactive Indonesia Stunting Risk Choropleth Map"
        className="relative h-full min-w-0 flex-1 overflow-hidden"
      >
        <IndonesiaMap
          provinces={provinces}
          hoveredProvinceId={hoveredProvinceId}
          onHoverProvince={setHoveredProvinceId}
          selectedIslandGroup={selectedIslandGroup}
          flyToTarget={flyToTarget}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </section>

      {/* COLLAPSIBLE TABBED RIGHT DRAWER (Desktop) & SNAP BOTTOM SHEET (Tablet/Mobile) */}
      <NationalSideDrawer
        provinces={provinces}
        filteredProvinces={filteredProvinces}
        topRiskyDistricts={topRiskyDistricts}
        isLoadingWatchlist={isLoadingWatchlist}
        isOpen={isDrawerOpen}
        onToggleOpen={() => setIsDrawerOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedIslandGroup={selectedIslandGroup}
        onIslandGroupChange={setSelectedIslandGroup}
        hoveredProvinceId={hoveredProvinceId}
        onHoverProvince={setHoveredProvinceId}
        onFlyToLocation={(type, id) =>
          setFlyToTarget({ type, id, timestamp: Date.now() })
        }
      />
    </main>
  );
}
