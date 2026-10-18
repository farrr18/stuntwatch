import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import predictions from "@/models/artifacts/stuntwatch_predictions_v3.json";

declare global {
  interface CloudflareEnv {
    TOGETHER_API_KEY?: string;
  }
}

type District = (typeof predictions.kabupaten)[number];
type RiskTier = District["risk_tier"];

const PROVINCES = [
  ...new Set(predictions.kabupaten.map((district) => district.provinsi)),
];
const RISK_TIERS: RiskTier[] = [
  "Rendah",
  "Sedang",
  "Tinggi",
  "Sangat Tinggi",
];

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

function findProvince(value: string): string | undefined {
  const normalized = slugify(value);
  return PROVINCES.find((province) => slugify(province) === normalized);
}

function notFound(detail = "Not found"): NextResponse {
  return NextResponse.json({ detail }, { status: 404 });
}

function getMapColor(tier: RiskTier): string {
  if (tier === "Sangat Tinggi") return "#ef4444";
  if (tier === "Tinggi") return "#f97316";
  if (tier === "Sedang") return "#eab308";
  return "#22c55e";
}

function provinceSummary(province: string, rows: District[]) {
  const predictions = rows.map((row) => row.prediction);
  const actuals = rows.map((row) => row.actual);
  const errors = rows.map((row) => Math.abs(row.prediction - row.actual));
  const highestRisk = [...rows].sort((a, b) => b.prediction - a.prediction)[0];
  const lowestRisk = [...rows].sort((a, b) => a.prediction - b.prediction)[0];

  return {
    province,
    slug: slugify(province),
    n_kabupaten: rows.length,
    avg_predicted: Number(
      (predictions.reduce((sum, value) => sum + value, 0) / rows.length).toFixed(2)
    ),
    avg_actual: Number(
      (actuals.reduce((sum, value) => sum + value, 0) / rows.length).toFixed(2)
    ),
    min_predicted: Number(Math.min(...predictions).toFixed(2)),
    max_predicted: Number(Math.max(...predictions).toFixed(2)),
    mae_in_province: Number(
      (errors.reduce((sum, value) => sum + value, 0) / rows.length).toFixed(2)
    ),
    tier_counts: Object.fromEntries(
      RISK_TIERS.map((tier) => [
        tier,
        rows.filter((row) => row.risk_tier === tier).length,
      ])
    ),
    highest_risk: highestRisk.kabupaten_kota,
    lowest_risk: lowestRisk.kabupaten_kota,
  };
}

async function getNarrative(domainId: number, district: District) {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.TOGETHER_API_KEY) {
    return NextResponse.json(
      { detail: "TOGETHER_API_KEY is not configured for this Worker" },
      { status: 503 }
    );
  }

  const excludedFeatures = new Set([
    "implied_pop",
    "dependency_ratio_rural",
    "is_kota",
    "depth_severity_ratio",
    "RAI_children_u5",
    "RAI_total_pop",
    "garis_kemiskinan",
  ]);
  const shapLines = district.top_features
    .filter((feature) => !excludedFeatures.has(feature.name) && feature.shap !== null)
    .slice(0, 5)
    .map(
      (feature) =>
        `- ${feature.name}: value=${feature.value} (${feature.shap > 0 ? "increases" : "reduces"} risk)`
    )
    .join("\n");
  const prompt = `You are a public-health policy analyst for Indonesian local governments. Write three concise paragraphs in Bahasa Indonesia, under 180 words total:
1. Summarize this district's stunting risk profile.
2. Explain why its dominant indicators are associated with risk without claiming causation.
3. Recommend two concrete priority interventions.
Do not mention SHAP or AI.

District: ${district.kabupaten_kota} (${district.provinsi})
Predicted stunting risk: ${district.prediction.toFixed(1)}% (${district.risk_tier})
Data confidence: ${district.data_confidence ?? "unknown"}
Dominant indicators:
${shapLines}`;

  let response: Response;
  try {
    response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });
  } catch {
    return NextResponse.json(
      { detail: "The narrative provider could not be reached" },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { detail: "The narrative provider returned an error" },
      { status: 502 }
    );
  }

  const result: {
    choices?: Array<{ message?: { content?: string | null } }>;
  } = await response.json();
  const narrative = result.choices?.[0]?.message?.content?.trim();
  if (!narrative) {
    return NextResponse.json(
      { detail: "The narrative provider returned an empty response" },
      { status: 502 }
    );
  }

  return NextResponse.json({ domain_id: domainId, narrative });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = new URL(request.url);
  const route = path.join("/");

  if (route === "health") {
    return NextResponse.json({
      status: "ok",
      regions: predictions.kabupaten.length,
      provinces: PROVINCES.length,
    });
  }

  if (route === "metrics") {
    return NextResponse.json({
      groupkfold: null,
      lopo: null,
    });
  }

  if (route === "map-data") {
    return NextResponse.json(
      Object.fromEntries(
        predictions.kabupaten.map((district) => [
          String(district.domain_id),
          {
            kabupaten: district.kabupaten_kota,
            provinsi: district.provinsi,
            pred: Number(district.prediction.toFixed(1)),
            actual: Number(district.actual.toFixed(1)),
            tier: district.risk_tier,
            color: getMapColor(district.risk_tier),
          },
        ])
      )
    );
  }

  if (route === "provinces") {
    const provinces = PROVINCES.map((province) => {
      const rows = predictions.kabupaten.filter(
        (district) => district.provinsi === province
      );
      const summary = provinceSummary(province, rows);
      const highestRisk = [...rows].sort(
        (a, b) => b.prediction - a.prediction
      )[0];

      return {
        province,
        slug: slugify(province),
        n_kabupaten: rows.length,
        avg_predicted: summary.avg_predicted,
        avg_actual: summary.avg_actual,
        max_predicted: summary.max_predicted,
        highest_risk_kabupaten: highestRisk.kabupaten_kota,
        tier_counts: summary.tier_counts,
      };
    })
      .sort((a, b) => b.avg_predicted - a.avg_predicted);

    return NextResponse.json(provinces);
  }

  if (route === "top-risky") {
    const requestedCount = Number.parseInt(url.searchParams.get("n") ?? "15", 10);
    if (!Number.isInteger(requestedCount) || requestedCount < 1) {
      return NextResponse.json(
        { detail: "Query parameter 'n' must be a positive integer" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      [...predictions.kabupaten]
        .sort((a, b) => b.prediction - a.prediction)
        .slice(0, requestedCount)
        .map((district) => ({
          domain_id: district.domain_id,
          kabupaten_kota: district.kabupaten_kota,
          provinsi: district.provinsi,
          prediction: district.prediction,
          actual: district.actual,
          risk_tier: district.risk_tier,
          data_confidence: district.data_confidence,
        }))
    );
  }

  if (route === "kabupaten") {
    const provinceQuery = url.searchParams.get("provinsi");
    let rows = predictions.kabupaten;
    if (provinceQuery) {
      const province = findProvince(provinceQuery);
      if (!province) return notFound(`Province '${provinceQuery}' not found`);
      rows = rows.filter((district) => district.provinsi === province);
    }

    if (url.searchParams.has("n")) {
      const count = Number.parseInt(url.searchParams.get("n") ?? "", 10);
      if (!Number.isInteger(count) || count < 1) {
        return NextResponse.json(
          { detail: "Query parameter 'n' must be a positive integer" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        [...rows]
          .sort((a, b) => b.prediction - a.prediction)
          .slice(0, count)
          .map((district) => ({
            domain_id: district.domain_id,
            kabupaten_kota: district.kabupaten_kota,
            provinsi: district.provinsi,
            prediction: district.prediction,
            actual: district.actual,
            risk_tier: district.risk_tier,
            data_confidence: district.data_confidence,
          }))
      );
    }

    return NextResponse.json(
      rows.map((district) => ({
        domain_id: district.domain_id,
        kabupaten_kota: district.kabupaten_kota,
        provinsi: district.provinsi,
        prediction: district.prediction,
        actual: district.actual,
        risk_tier: district.risk_tier,
        data_confidence: district.data_confidence,
      }))
    );
  }

  if (path[0] === "kabupaten" && path.length === 2) {
    const domainId = Number(path[1]);
    if (!Number.isInteger(domainId)) {
      return NextResponse.json({ detail: "Invalid district id" }, { status: 400 });
    }
    const district = predictions.kabupaten.find(
      (row) => row.domain_id === domainId
    );
    return district ? NextResponse.json(district) : notFound();
  }

  if (
    path[0] === "kabupaten" &&
    path[2] === "narrative" &&
    path.length === 3
  ) {
    const domainId = Number(path[1]);
    if (!Number.isInteger(domainId)) {
      return NextResponse.json({ detail: "Invalid district id" }, { status: 400 });
    }
    const district = predictions.kabupaten.find(
      (row) => row.domain_id === domainId
    );
    return district
      ? getNarrative(domainId, district)
      : notFound();
  }

  if (
    path[0] === "provinsi" &&
    (path.length === 2 || (path.length === 3 && path[2] === "summary"))
  ) {
    const province = findProvince(path[1]);
    if (!province) return notFound(`Province '${path[1]}' not found`);

    const rows = predictions.kabupaten
      .filter((district) => district.provinsi === province)
      .sort((a, b) => b.prediction - a.prediction);

    if (path[2] === "summary") {
      return NextResponse.json(provinceSummary(province, rows));
    }

    return NextResponse.json({
      province,
      slug: slugify(province),
      n_kabupaten: rows.length,
      avg_predicted: Number(
        (
          rows.reduce((sum, district) => sum + district.prediction, 0) /
          rows.length
        ).toFixed(2)
      ),
      avg_actual: Number(
        (
          rows.reduce((sum, district) => sum + district.actual, 0) /
          rows.length
        ).toFixed(2)
      ),
      kabupaten: rows.map((district) => ({
        domain_id: district.domain_id,
        kabupaten_kota: district.kabupaten_kota,
        prediction: Number(district.prediction.toFixed(2)),
        actual: Number(district.actual.toFixed(2)),
        error: Number((district.prediction - district.actual).toFixed(2)),
        risk_tier: district.risk_tier,
        actual_tier: district.actual_tier,
        top_feature: district.top_features[0]?.name ?? null,
        top_feature_shap:
          district.top_features[0]?.shap != null
            ? Number(district.top_features[0].shap.toFixed(2))
            : null,
      })),
    });
  }

  return notFound();
}
