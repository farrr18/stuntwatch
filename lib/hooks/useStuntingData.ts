"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchMapData,
  fetchProvinces,
  fetchTopRiskyDistricts,
  fetchProvinceSummary,
  fetchKabKotaByProvince,
  fetchExplanationByKabKota,
  fetchDistrictNarrative,
  resolveProvinceSlug,
} from "../api/mockAdapter";
import { loadTopoJsonFeatures, type MapFeatureCollection } from "../geo";
import type {
  MapDataDictionary,
  Province,
  TopRiskyDistrict,
  ProvinceSummary,
  KabKota,
  ExplanationData,
  DistrictNarrativeData,
} from "../types";

/**
 * Data Contract Hooks (Connected to the Live StuntWatch API Endpoints)
 */

// 0. GET /api/map-data (Leaflet Choropleth Heatmap Dictionary)
export function useMapData() {
  return useQuery<MapDataDictionary, Error>({
    queryKey: ["map-data"],
    queryFn: () => fetchMapData(),
    staleTime: 5 * 60 * 1000,
  });
}

// 1. GET /api/provinces
export function useProvinces() {
  return useQuery<Province[], Error>({
    queryKey: ["provinces"],
    queryFn: () => fetchProvinces(),
    staleTime: 5 * 60 * 1000,
  });
}

// 2. GET /api/top-risky?n=15
export function useTopRiskyDistricts(n: number = 15) {
  return useQuery<TopRiskyDistrict[], Error>({
    queryKey: ["top-risky", n],
    queryFn: () => fetchTopRiskyDistricts(n),
    staleTime: 5 * 60 * 1000,
  });
}

// 3. GET /api/provinsi/{provinceSlug}/summary
export function useProvinceSummary(provinceIdOrSlug: string) {
  const slug = resolveProvinceSlug(provinceIdOrSlug);
  return useQuery<ProvinceSummary, Error>({
    queryKey: ["province-summary", slug],
    queryFn: () => fetchProvinceSummary(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

// 4. GET /api/provinsi/{provinceSlug}
export function useKabKota(provinceIdOrSlug: string) {
  const slug = resolveProvinceSlug(provinceIdOrSlug);
  return useQuery<KabKota[], Error>({
    queryKey: ["kabkota", slug],
    queryFn: () => fetchKabKotaByProvince(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

// 5. GET /api/kabupaten/{kabKotaId} (Immediate SHAP & District Features)
export function useExplanation(kabKotaId: string) {
  return useQuery<ExplanationData, Error>({
    queryKey: ["explanation", kabKotaId],
    queryFn: () => fetchExplanationByKabKota(kabKotaId),
    enabled: Boolean(kabKotaId),
    staleTime: 5 * 60 * 1000,
  });
}

// 6. GET /api/kabupaten/{kabKotaId}/narrative (Non-blocking Together AI Policy Brief)
export function useDistrictNarrative(kabKotaId: string) {
  return useQuery<DistrictNarrativeData, Error>({
    queryKey: ["district-narrative", kabKotaId],
    queryFn: () => fetchDistrictNarrative(kabKotaId),
    enabled: Boolean(kabKotaId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useProvincesGeo() {
  return useQuery<MapFeatureCollection, Error>({
    queryKey: ["geo", "provinces"],
    queryFn: () => loadTopoJsonFeatures("/geo/provinces.topojson", "provinces"),
    staleTime: Infinity,
  });
}

export function useAllKabKotaGeo() {
  return useQuery<MapFeatureCollection, Error>({
    queryKey: ["geo", "kabupaten-all"],
    queryFn: () =>
      loadTopoJsonFeatures("/geo/kabupaten-all.topojson", "kabkota"),
    staleTime: Infinity,
  });
}

export function useKabKotaGeo(provinceIdOrSlug: string) {
  const slug = resolveProvinceSlug(provinceIdOrSlug);
  return useQuery<MapFeatureCollection, Error>({
    queryKey: ["geo", "kabkota", slug],
    queryFn: () =>
      loadTopoJsonFeatures(`/geo/kabkota/${slug}.topojson`, "kabkota"),
    enabled: Boolean(slug),
    staleTime: Infinity,
  });
}
