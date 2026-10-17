import fs from "fs";
import path from "path";

const API_BASE = "https://based-concluded-sitemap-separately.trycloudflare.com";
const GADM_ADM2_URL =
  "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_IDN_2.json";
const GEOBOUNDARIES_ADM2_URL =
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson";

type Ring = number[][];
type PolygonCoords = Ring[];
type MultiPolygonCoords = PolygonCoords[];

interface GeoFeatureInput {
  id: string;
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: PolygonCoords | MultiPolygonCoords;
  };
}

/**
 * Simplifies a coordinate ring by rounding to 4 decimal places (~11m precision)
 * and filtering out redundant vertices closer than `minDist` degrees while preserving topology.
 */
function simplifyRing(ring: Ring, minDist = 0.0035): Ring {
  if (!ring || ring.length < 4) return ring;
  const out: Ring = [];
  let prevLon = Infinity;
  let prevLat = Infinity;

  for (let i = 0; i < ring.length; i++) {
    const pt = ring[i];
    const lon = Number(pt[0].toFixed(4));
    const lat = Number(pt[1].toFixed(4));
    const isEndpoint = i === 0 || i === ring.length - 1;
    const dist = Math.hypot(lon - prevLon, lat - prevLat);
    if (isEndpoint || dist >= minDist) {
      out.push([lon, lat]);
      prevLon = lon;
      prevLat = lat;
    }
  }

  // Ensure closed ring with at least 4 vertices
  if (out.length < 4) {
    return ring.map((pt) => [Number(pt[0].toFixed(4)), Number(pt[1].toFixed(4))]);
  }
  const first = out[0];
  const last = out[out.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    out.push([first[0], first[1]]);
  }
  return out;
}

function simplifyGeometry(
  geom: {
    type: "Polygon" | "MultiPolygon";
    coordinates: PolygonCoords | MultiPolygonCoords;
  },
  minDist = 0.0035
): {
  type: "Polygon" | "MultiPolygon";
  coordinates: PolygonCoords | MultiPolygonCoords;
} {
  if (geom.type === "Polygon") {
    const poly = (geom.coordinates as PolygonCoords)
      .map((ring) => simplifyRing(ring, minDist))
      .filter((ring) => ring.length >= 4);
    return {
      type: "Polygon",
      coordinates: poly.length > 0 ? poly : (geom.coordinates as PolygonCoords),
    };
  } else {
    const multi = (geom.coordinates as MultiPolygonCoords)
      .map((poly) =>
        poly
          .map((ring) => simplifyRing(ring, minDist))
          .filter((ring) => ring.length >= 4)
      )
      .filter((poly) => poly.length > 0);
    return {
      type: "MultiPolygon",
      coordinates:
        multi.length > 0 ? multi : (geom.coordinates as MultiPolygonCoords),
    };
  }
}

/**
 * Encodes an array of Polygon / MultiPolygon features into a valid unquantized TopoJSON Topology.
 */
function featuresToTopoJSON(objectName: string, features: GeoFeatureInput[]) {
  const arcs: Ring[] = [];

  const geometries = features.map((f) => {
    const simplified = simplifyGeometry(f.geometry);
    if (simplified.type === "Polygon") {
      const polyCoords = simplified.coordinates as PolygonCoords;
      const polyArcs: number[][] = polyCoords.map((ring) => {
        const arcIdx = arcs.length;
        arcs.push(ring);
        return [arcIdx];
      });
      return {
        type: "Polygon",
        id: f.id,
        properties: f.properties,
        arcs: polyArcs,
      };
    } else {
      const multiCoords = simplified.coordinates as MultiPolygonCoords;
      const multiArcs: number[][][] = multiCoords.map((polyCoords) =>
        polyCoords.map((ring) => {
          const arcIdx = arcs.length;
          arcs.push(ring);
          return [arcIdx];
        })
      );
      return {
        type: "MultiPolygon",
        id: f.id,
        properties: f.properties,
        arcs: multiArcs,
      };
    }
  });

  return {
    type: "Topology",
    objects: {
      [objectName]: {
        type: "GeometryCollection",
        geometries,
      },
    },
    arcs,
  };
}

const SLUG_TO_META: Record<
  string,
  {
    id: string;
    islandGroup: string;
  }
> = {
  aceh: { id: "11", islandGroup: "Sumatera" },
  "sumatera-utara": { id: "12", islandGroup: "Sumatera" },
  "sumatera-barat": { id: "13", islandGroup: "Sumatera" },
  riau: { id: "14", islandGroup: "Sumatera" },
  jambi: { id: "15", islandGroup: "Sumatera" },
  "sumatera-selatan": { id: "16", islandGroup: "Sumatera" },
  bengkulu: { id: "17", islandGroup: "Sumatera" },
  lampung: { id: "18", islandGroup: "Sumatera" },
  "bangka-belitung": { id: "19", islandGroup: "Sumatera" },
  "kepulauan-riau": { id: "21", islandGroup: "Sumatera" },
  "dki-jakarta": { id: "31", islandGroup: "Jawa" },
  "jawa-barat": { id: "32", islandGroup: "Jawa" },
  "jawa-tengah": { id: "33", islandGroup: "Jawa" },
  "di-yogyakarta": { id: "34", islandGroup: "Jawa" },
  "jawa-timur": { id: "35", islandGroup: "Jawa" },
  banten: { id: "36", islandGroup: "Jawa" },
  bali: { id: "51", islandGroup: "Bali & Nusa Tenggara" },
  "nusa-tenggara-barat": { id: "52", islandGroup: "Bali & Nusa Tenggara" },
  "nusa-tenggara-timur": { id: "53", islandGroup: "Bali & Nusa Tenggara" },
  "kalimantan-barat": { id: "61", islandGroup: "Kalimantan" },
  "kalimantan-tengah": { id: "62", islandGroup: "Kalimantan" },
  "kalimantan-selatan": { id: "63", islandGroup: "Kalimantan" },
  "kalimantan-timur": { id: "64", islandGroup: "Kalimantan" },
  "kalimantan-utara": { id: "65", islandGroup: "Kalimantan" },
  "sulawesi-utara": { id: "71", islandGroup: "Sulawesi" },
  "sulawesi-tengah": { id: "72", islandGroup: "Sulawesi" },
  "sulawesi-selatan": { id: "73", islandGroup: "Sulawesi" },
  "sulawesi-tenggara": { id: "74", islandGroup: "Sulawesi" },
  gorontalo: { id: "75", islandGroup: "Sulawesi" },
  "sulawesi-barat": { id: "76", islandGroup: "Sulawesi" },
  maluku: { id: "81", islandGroup: "Maluku & Papua" },
  "maluku-utara": { id: "82", islandGroup: "Maluku & Papua" },
  papua: { id: "91", islandGroup: "Maluku & Papua" },
  "papua-barat": { id: "92", islandGroup: "Maluku & Papua" },
  "papua-selatan": { id: "93", islandGroup: "Maluku & Papua" },
  "papua-tengah": { id: "94", islandGroup: "Maluku & Papua" },
  "papua-pegunungan": { id: "95", islandGroup: "Maluku & Papua" },
  "papua-barat-daya": { id: "96", islandGroup: "Maluku & Papua" },
};

function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/kabupaten|kota|adm\.|administrasi|kepulauan|kep\./g, "")
    .replace(/mahakam ulu/g, "mahakam hulu")
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  const rootDir = process.cwd();
  const geoDir = path.join(rootDir, "public", "geo");
  const kabKotaGeoDir = path.join(geoDir, "kabkota");
  const mocksDir = path.join(rootDir, "mocks");

  fs.mkdirSync(kabKotaGeoDir, { recursive: true });
  fs.mkdirSync(mocksDir, { recursive: true });

  console.log("1. Fetching /api/provinces and /api/kabupaten from live backend...");
  const [provRes, kabRes] = await Promise.all([
    fetch(`${API_BASE}/api/provinces`),
    fetch(`${API_BASE}/api/kabupaten`),
  ]);

  const liveProvinces = (await provRes.json()) as Array<{
    province: string;
    slug: string;
    n_kabupaten: number;
    avg_predicted: number;
    avg_actual: number;
    max_predicted: number;
    highest_risk_kabupaten: string;
    tier_counts: Record<string, number>;
  }>;

  const liveKabupaten = (await kabRes.json()) as Array<{
    domain_id: number;
    kabupaten_kota: string;
    provinsi: string;
    prediction: number;
    actual: number;
    risk_tier: string;
    data_confidence: string;
  }>;

  // Save raw live snapshots in mocks/ for offline fallback
  fs.writeFileSync(
    path.join(mocksDir, "live-provinces.json"),
    JSON.stringify(liveProvinces, null, 2)
  );
  fs.writeFileSync(
    path.join(mocksDir, "live-kabupaten.json"),
    JSON.stringify(liveKabupaten, null, 2)
  );

  console.log("2. Fetching real Indonesia ADM2 geographic boundaries (GADM 4.1 + geoBoundaries)...");
  const [gadmRes, gbRes] = await Promise.all([
    fetch(GADM_ADM2_URL),
    fetch(GEOBOUNDARIES_ADM2_URL),
  ]);

  const gadmJson = (await gadmRes.json()) as {
    features: Array<{
      properties: Record<string, unknown>;
      geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: PolygonCoords | MultiPolygonCoords;
      };
    }>;
  };
  const gbJson = (await gbRes.json()) as {
    features: Array<{
      properties: Record<string, unknown>;
      geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: PolygonCoords | MultiPolygonCoords;
      };
    }>;
  };

  // Index real ADM2 boundaries by 4-digit BPS code (CC_2) and normalized name
  const byCC = new Map<
    string,
    {
      type: "Polygon" | "MultiPolygon";
      coordinates: PolygonCoords | MultiPolygonCoords;
    }
  >();
  const byNorm = new Map<
    string,
    {
      type: "Polygon" | "MultiPolygon";
      coordinates: PolygonCoords | MultiPolygonCoords;
    }
  >();

  for (const f of gadmJson.features) {
    const cc = String(f.properties.CC_2 ?? "").trim();
    if (cc && cc !== "NA") {
      byCC.set(cc, f.geometry);
    }
    const n1 = normName(String(f.properties.NAME_1 ?? ""));
    const n2 = normName(String(f.properties.NAME_2 ?? ""));
    if (n2) {
      byNorm.set(`${n1}:${n2}`, f.geometry);
      if (!byNorm.has(n2)) {
        byNorm.set(n2, f.geometry);
      }
    }
  }

  for (const f of gbJson.features) {
    const shapeName = normName(String(f.properties.shapeName ?? ""));
    if (shapeName && !byNorm.has(shapeName)) {
      byNorm.set(shapeName, f.geometry);
    }
  }

  const provinceGeoFeatures: GeoFeatureInput[] = [];
  const allKabGeoFeatures: GeoFeatureInput[] = [];
  let matchedCount = 0;

  for (const prov of liveProvinces) {
    const meta = SLUG_TO_META[prov.slug] ?? {
      id: prov.slug,
      islandGroup: "Indonesia",
    };

    const kabsInProv = liveKabupaten.filter(
      (k) => k.provinsi.toLowerCase() === prov.province.toLowerCase()
    );

    const kabGeoFeatures: GeoFeatureInput[] = [];
    const provinceMultiPolygons: MultiPolygonCoords = [];

    for (const kab of kabsInProv) {
      const idStr = String(kab.domain_id);
      const geom =
        byCC.get(idStr) ??
        byNorm.get(`${normName(kab.provinsi)}:${normName(kab.kabupaten_kota)}`) ??
        byNorm.get(normName(kab.kabupaten_kota));

      if (!geom) {
        console.warn(`WARN: No real boundary found for ${kab.domain_id} ${kab.kabupaten_kota}`);
        continue;
      }

      matchedCount++;

      kabGeoFeatures.push({
        id: idStr,
        properties: {
          id: idStr,
          domain_id: kab.domain_id,
          name: kab.kabupaten_kota,
          provinceId: meta.id,
          provinceSlug: prov.slug,
          islandGroup: meta.islandGroup,
          type: kab.kabupaten_kota.toLowerCase().startsWith("kota")
            ? "Kota"
            : "Kabupaten",
        },
        geometry: geom,
      });

      if (geom.type === "Polygon") {
        provinceMultiPolygons.push(geom.coordinates as PolygonCoords);
      } else {
        provinceMultiPolygons.push(...(geom.coordinates as MultiPolygonCoords));
      }
    }

    allKabGeoFeatures.push(...kabGeoFeatures);

    // Save per-province Kabupaten/Kota TopoJSON (both slug and 2-digit id)
    const kabTopo = featuresToTopoJSON("kabkota", kabGeoFeatures);
    fs.writeFileSync(
      path.join(kabKotaGeoDir, `${prov.slug}.topojson`),
      JSON.stringify(kabTopo)
    );
    fs.writeFileSync(
      path.join(kabKotaGeoDir, `${meta.id}.topojson`),
      JSON.stringify(kabTopo)
    );

    // Build real Province MultiPolygon from its constituent Kabupaten/Kota polygons
    provinceGeoFeatures.push({
      id: prov.slug,
      properties: {
        id: meta.id,
        slug: prov.slug,
        provinceSlug: prov.slug,
        name: prov.province,
        islandGroup: meta.islandGroup,
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: provinceMultiPolygons,
      },
    });
  }

  const provTopo = featuresToTopoJSON("provinces", provinceGeoFeatures);
  fs.writeFileSync(
    path.join(geoDir, "provinces.topojson"),
    JSON.stringify(provTopo)
  );

  const allKabTopo = featuresToTopoJSON("kabkota", allKabGeoFeatures);
  fs.writeFileSync(
    path.join(geoDir, "kabupaten-all.topojson"),
    JSON.stringify(allKabTopo)
  );

  console.log(
    `Successfully built real geographic TopoJSON boundaries for ${provinceGeoFeatures.length} provinces and ${matchedCount}/${liveKabupaten.length} Kabupaten/Kota!`
  );
}

main();
