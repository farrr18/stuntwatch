export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export type RegionType = "Kabupaten" | "Kota";

export type Locale = "id" | "en";

export type IndicatorId = string;

export interface LocalizedText {
  id: string;
  en: string;
}

export interface TierCounts {
  Rendah: number;
  Sedang: number;
  Tinggi: number;
  "Sangat Tinggi": number;
}

export interface MapDataEntry {
  kabupaten: string;
  provinsi: string;
  pred: number;
  actual: number;
  tier: string;
  color: string;
}

export type MapDataDictionary = Record<string, MapDataEntry>;

export interface Province {
  id: string; // 2-digit BPS code, e.g., "91"
  slug: string; // Live API slug, e.g., "papua", "papua-pegunungan"
  name: string; // e.g., "Papua"
  province: string; // Live API field
  islandGroup: string;
  n_kabupaten: number;
  avg_predicted: number;
  avg_actual: number;
  max_predicted: number;
  highest_risk_kabupaten: string;
  tier_counts: TierCounts;
  riskIndex: number; // Normalized / prevalence score used for display
  riskLevel: RiskLevel;
  nationalRank: number; // 1 - 38 (1 = highest risk)
  totalKabKota: number;
  highRiskKabKotaCount: number;
  stuntingPrevalenceEst: number;
  centroid: [number, number];
}

export interface TopRiskyDistrict {
  rank: number;
  domain_id: number;
  kabupaten_kota: string;
  provinsi: string;
  provinceSlug: string;
  prediction: number;
  actual: number;
  risk_tier: string;
  riskLevel: RiskLevel;
  data_confidence?: string;
}

export interface ProvinceSummary {
  province: string;
  slug: string;
  n_kabupaten: number;
  avg_predicted: number;
  avg_actual: number;
  min_predicted: number;
  max_predicted: number;
  mae_in_province: number;
  tier_counts: TierCounts;
  highest_risk: string;
  lowest_risk: string;
}

export interface KabKota {
  id: string; // Stringified domain_id, e.g. "9427"
  domain_id: number; // Live API integer domain_id, e.g. 9427
  provinceId: string; // Province slug or 2-digit code
  provinceSlug: string;
  provinceName: string;
  name: string; // e.g., "Supiori"
  kabupaten_kota: string; // Live API field
  type: RegionType;
  prediction: number; // Live API ML predicted %
  actual: number; // Live API actual SSGI %
  error: number; // prediction - actual
  risk_tier: string; // "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi"
  actual_tier: string;
  top_feature: string; // e.g., "pengeluaran_kab"
  top_feature_shap: number; // e.g., 5.51
  riskIndex: number; // Display score
  riskLevel: RiskLevel;
  provinceRank: number;
  totalInProvince: number;
  nationalRank: number;
  totalNational: number;
  topDriverLabel: LocalizedText;
}

export interface LiveShapFeature {
  name: string;
  value: number | null;
  shap: number;
}

export interface RiskFactor {
  id: IndicatorId;
  rawName?: string;
  label: LocalizedText;
  value: number | null;
  unit: string;
  provinceAvg: number;
  nationalAvg: number;
  /**
   * Live SHAP value (positive increases stunting risk, negative reduces risk)
   */
  contribution: number;
  higherIsWorse: boolean;
  status: "worse" | "better" | "neutral";
  description: LocalizedText;
  impactMechanism: LocalizedText;
}

export interface RecommendationItem {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  targetFactorId: IndicatorId;
  title: LocalizedText;
  action: LocalizedText;
  sector: LocalizedText;
}

export interface DistrictNarrativeData {
  kabKotaId: string;
  summary: LocalizedText;
  recommendations: RecommendationItem[];
  source: "together-ai" | "ai-synthesized";
}

export interface ExplanationData {
  kabKotaId: string;
  domain_id: number;
  provinceId: string;
  provinceSlug: string;
  provinceName: string;
  name: string;
  type: RegionType;
  prediction: number;
  actual: number;
  risk_tier: string;
  actual_tier: string;
  data_confidence: string;
  riskIndex: number;
  riskLevel: RiskLevel;
  provinceRank: number;
  totalInProvince: number;
  nationalRank: number;
  totalNational: number;
  summary: LocalizedText;
  factors: RiskFactor[];
  top_features: LiveShapFeature[];
  recommendations: RecommendationItem[];
  methodology: {
    dataYear: string;
    source: string;
    modelVersion: string;
    disclaimer: LocalizedText;
  };
}
