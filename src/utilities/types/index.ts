/////////////////////////
// UTILITIES TYPES //
/////////////////////////

import * as d3 from 'd3';
import { RefObject } from "react";
import { ControlProps } from "../../components/types";

export interface GlobeInteractionsConfig {
  dimensions: Dimensions;
  d3Elements: D3Elements;
  globeBase: FeatureConfig;
  adjacentFeatures: FeatureConfig;
  interactions: Interactions;
}

export interface Interactions {
  onGlobeClick: (coords: [number, number] | never[],
    screenPos: [number, number],
    svgRef: RefObject<SVGSVGElement | null>,
  ) => void,
  controlsState: ControlProps,
};

export type D3Elements = {
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>;
  g: SVGGElement | unknown | null | undefined;
  svgRef: RefObject<SVGSVGElement | null>;
};

export type Dimensions = {
  width: number;
  height: number;
  radius: number;
}

export type CountryFeatureProps = {
  country?: string;
  NAME: string;
}

export type FeatureConfig = {
  features: d3.Selection<SVGPathElement, unknown, SVGGElement, unknown>;
  path: d3.GeoPath<any, d3.GeoPermissibleObjects>;
  projection: d3.GeoProjection;
  graticules?: SVGGElement | unknown | null | undefined;
  rotationFactor?: number;
}

export interface SetupGraphics {
  radius: number,
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
};

export interface GlobeConfig {
  svgRef: RefObject<SVGSVGElement | null>,
  onGlobeClick: (coords: [number, number] | never[],
    screenPos: [number, number],
    svgRef: RefObject<SVGSVGElement | null>,
  ) => void,
  controlsState: ControlProps,
};

export interface GlobeState {
  g: SVGGElement | unknown | null | undefined,
  path: d3.GeoPath<any, d3.GeoPermissibleObjects>,
  projection: d3.GeoProjection,
};

export type D3Selection = d3.Selection<SVGPathElement, unknown, SVGGElement, unknown>

export type Position = [number, number, number?];

export interface LineString {
  type: 'LineString';
  coordinates: Array<Position>;
}
export interface Polygon {
  type: 'Polygon';
  coordinates: Position[][];
}
export interface Point {
  type: 'Point';
  coordinates: Position;
}

export type Geometry = LineString | Polygon | Point;

// Properties: Generic to allow any key-value pairs
export type Properties = { [key: string]: unknown };

export interface Feature<T extends Geometry = Geometry, P = Properties> {
  type: 'Feature';
  geometry: T | null;
  properties: P;
  id?: string | number;
}

export interface GeoJSONgeneric<T extends Geometry = Geometry, P = Properties> {
  type: 'FeatureCollection';
  features: Feature<T, P>[];
}
