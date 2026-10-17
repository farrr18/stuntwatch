"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchProvinces,
  fetchKabKotaByProvince,
  fetchExplanationByKabKota,
} from "../api/mockAdapter";
import { loadTopoJsonFeatures, type MapFeatureCollection } from "../geo";
import type { Province, KabKota, ExplanationData } from "../types";

/**
 * Data Contract Hooks (PRD Section 5)
 * UI components must exclusively use these hooks to access StuntWatch data.
 */

export function useProvinces() {
  return useQuery<Province[], Error>({
    queryKey: ["provinces"],
    queryFn: () => fetchProvinces(),
    staleTime: Infinity,
  });
}

export function useKabKota(provinceId: string) {
  return useQuery<KabKota[], Error>({
    queryKey: ["kabkota", provinceId],
    queryFn: () => fetchKabKotaByProvince(provinceId),
    enabled: Boolean(provinceId),
    staleTime: Infinity,
  });
}

export function useExplanation(kabKotaId: string) {
  return useQuery<ExplanationData, Error>({
    queryKey: ["explanation", kabKotaId],
    queryFn: () => fetchExplanationByKabKota(kabKotaId),
    enabled: Boolean(kabKotaId),
    staleTime: Infinity,
  });
}

export function useProvincesGeo() {
  return useQuery<MapFeatureCollection, Error>({
    queryKey: ["geo", "provinces"],
    queryFn: () => loadTopoJsonFeatures("/geo/provinces.topojson", "provinces"),
    staleTime: Infinity,
  });
}

export function useKabKotaGeo(provinceId: string) {
  return useQuery<MapFeatureCollection, Error>({
    queryKey: ["geo", "kabkota", provinceId],
    queryFn: () =>
      loadTopoJsonFeatures(`/geo/kabkota/${provinceId}.topojson`, "kabkota"),
    enabled: Boolean(provinceId),
    staleTime: Infinity,
  });
}
