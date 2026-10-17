import type { Province, KabKota, ExplanationData } from "../types";
import provincesData from "../../mocks/provinces.json";

/**
 * Isolated Mock Adapter (`lib/api/mockAdapter.ts`).
 * All UI hooks call this adapter. When transitioning to production APIs,
 * replace the bodies of these three functions with `fetch(API_BASE_URL + ...)` calls.
 */

export async function fetchProvinces(): Promise<Province[]> {
  return provincesData as unknown as Province[];
}

export async function fetchKabKotaByProvince(
  provinceId: string
): Promise<KabKota[]> {
  const normalized = provinceId.trim();
  const mod = await import(`../../mocks/kabkota/${normalized}.json`);
  return (mod.default ?? mod) as KabKota[];
}

export async function fetchExplanationByKabKota(
  kabKotaId: string
): Promise<ExplanationData> {
  const normalized = kabKotaId.trim();
  const mod = await import(`../../mocks/explanations/${normalized}.json`);
  return (mod.default ?? mod) as ExplanationData;
}
