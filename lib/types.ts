export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export type RegionType = "Kabupaten" | "Kota";

export type Locale = "id" | "en";

export type IndicatorId =
  | "poverty_rate"
  | "sanitation_access"
  | "clean_water_access"
  | "exclusive_breastfeeding"
  | "maternal_anemia"
  | "antenatal_care"
  | "basic_immunization"
  | "low_birth_weight"
  | "dietary_diversity"
  | "mothers_education"
  | "early_marriage"
  | "food_insecurity";

export interface LocalizedText {
  id: string;
  en: string;
}

export interface Province {
  id: string; // 2-digit BPS code, e.g., "11"
  name: string; // e.g., "Aceh"
  islandGroup: string; // Sumatera, Jawa, Kalimantan, Sulawesi, Bali & Nusa Tenggara, Maluku & Papua
  riskIndex: number; // 0 - 100
  riskLevel: RiskLevel;
  nationalRank: number; // 1 - 38 (1 = highest risk)
  totalKabKota: number;
  highRiskKabKotaCount: number;
  stuntingPrevalenceEst: number; // Estimated % for context
  centroid: [number, number]; // [lon, lat]
}

export interface KabKota {
  id: string; // 4-digit BPS code, e.g., "1101"
  provinceId: string; // 2-digit BPS code
  provinceName: string;
  name: string; // e.g., "Kab. Aceh Utara"
  type: RegionType; // "Kabupaten" | "Kota"
  riskIndex: number; // 0 - 100
  riskLevel: RiskLevel;
  provinceRank: number; // 1 - N in province
  totalInProvince: number;
  nationalRank: number; // 1 - 514
  totalNational: number;
  topDriverLabel: LocalizedText;
}

export interface RiskFactor {
  id: IndicatorId;
  label: LocalizedText;
  value: number;
  unit: string;
  provinceAvg: number;
  nationalAvg: number;
  /**
   * SHAP-like normalized contribution to stunting risk (-1.0 to +1.0)
   * Positive (+) increases stunting risk (red bar extending right)
   * Negative (-) protects against stunting risk (green bar extending left)
   */
  contribution: number;
  /**
   * Whether higher raw value is worse (e.g., Poverty Rate) or better (e.g., Clean Water Access)
   */
  higherIsWorse: boolean;
  /**
   * Semantic comparison against provincial/national benchmark
   */
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

export interface ExplanationData {
  kabKotaId: string;
  provinceId: string;
  provinceName: string;
  name: string;
  type: RegionType;
  riskIndex: number;
  riskLevel: RiskLevel;
  provinceRank: number;
  totalInProvince: number;
  nationalRank: number;
  totalNational: number;
  summary: LocalizedText;
  factors: RiskFactor[];
  recommendations: RecommendationItem[];
  methodology: {
    dataYear: string;
    source: string;
    modelVersion: string;
    disclaimer: LocalizedText;
  };
}
