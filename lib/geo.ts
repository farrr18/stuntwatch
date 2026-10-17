import { feature } from "topojson-client";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";

export interface GeoFeatureProperties {
  id: string;
  name: string;
  slug?: string;
  bpsId?: string;
  islandGroup?: string;
  provinceId?: string;
  provinceSlug?: string;
  type?: string;
  [key: string]: unknown;
}

export type MapFeatureCollection = FeatureCollection<
  Geometry,
  GeoFeatureProperties
>;

/**
 * Loads a TopoJSON file from `/geo/...` and converts the named object into a GeoJSON FeatureCollection.
 */
export async function loadTopoJsonFeatures(
  url: string,
  objectName: string
): Promise<MapFeatureCollection> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load TopoJSON from ${url}: ${res.status}`);
  }
  const topology = (await res.json()) as Topology<{
    [key: string]: GeometryCollection<GeoFeatureProperties>;
  }>;
  const geomObject = topology.objects[objectName];
  if (!geomObject) {
    throw new Error(`Object "${objectName}" not found in TopoJSON at ${url}`);
  }
  return feature(topology, geomObject);
}

/**
 * Creates a fitted D3 Mercator projection and SVG path generator for any FeatureCollection.
 */
export function createFittedPathGenerator(
  featureCollection: MapFeatureCollection,
  width: number,
  height: number,
  padding = 24
) {
  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    featureCollection as GeoPermissibleObjects
  );
  const pathGenerator = geoPath().projection(projection);
  return { projection, pathGenerator };
}
