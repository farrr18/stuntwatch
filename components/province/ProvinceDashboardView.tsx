"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useProvinces, useKabKota } from "@/lib/hooks/useStuntingData";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProvinceMap } from "@/components/map/ProvinceMap";
import { KabKotaRankList } from "@/components/ranking/KabKotaRankList";
import { ExplanationPanel } from "@/components/explanation/ExplanationPanel";

interface ProvinceDashboardViewProps {
  provinceId: string;
  initialKabKotaId?: string;
}

export function ProvinceDashboardView({
  provinceId,
  initialKabKotaId,
}: ProvinceDashboardViewProps) {
  const router = useRouter();
  const { data: provinces } = useProvinces();
  const { data: kabKotaList, isLoading } = useKabKota(provinceId);

  const [hoveredKabKotaId, setHoveredKabKotaId] = useState<string | null>(null);

  const province = useMemo(
    () => provinces?.find((p) => p.id === provinceId),
    [provinces, provinceId]
  );

  // Determine active KabKota (either deep-linked or highest-risk rank #1 by default)
  const activeKabKota = useMemo(() => {
    if (!kabKotaList || kabKotaList.length === 0) return null;
    if (initialKabKotaId) {
      const found = kabKotaList.find((k) => k.id === initialKabKotaId);
      if (found) return found;
    }
    return (
      kabKotaList.find((k) => k.provinceRank === 1) ?? kabKotaList[0]
    );
  }, [kabKotaList, initialKabKotaId]);

  const handleSelectKabKota = (nextKabKotaId: string) => {
    router.push(`/provinsi/${provinceId}/${nextKabKotaId}`, { scroll: false });
  };

  if (isLoading || !kabKotaList || !activeKabKota) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-border bg-card p-6">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-rose-600" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Loading Province Data...
          </p>
        </div>
      </main>
    );
  }

  const provinceName = province?.name ?? activeKabKota.provinceName;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Row 1: Breadcrumb Bar (12 Cols) */}
      <Breadcrumb
        provinceId={provinceId}
        provinceName={provinceName}
        kabKotaName={activeKabKota.name}
      />

      {/* Row 2: Split Map (7 Cols Desktop) + Ranked List (5 Cols Desktop) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProvinceMap
            provinceId={provinceId}
            provinceName={provinceName}
            kabKotaList={kabKotaList}
            selectedKabKotaId={activeKabKota.id}
            hoveredKabKotaId={hoveredKabKotaId}
            onSelectKabKota={handleSelectKabKota}
            onHoverKabKota={setHoveredKabKotaId}
          />
        </div>
        <div className="lg:col-span-5">
          <KabKotaRankList
            items={kabKotaList}
            selectedKabKotaId={activeKabKota.id}
            hoveredKabKotaId={hoveredKabKotaId}
            onSelectKabKota={handleSelectKabKota}
            onHoverKabKota={setHoveredKabKotaId}
          />
        </div>
      </div>

      {/* Row 3: Full 12-Col 7-Block Explanation Panel Below Ranked List */}
      <ExplanationPanel kabKotaId={activeKabKota.id} />
    </main>
  );
}
