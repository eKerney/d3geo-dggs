import * as h3 from 'h3-js';
import { cellToBoundary, u64ToHex, cellToChildren, cellToLonLat, hexToU64 } from "a5-js";
import { Geometry, Polygon, Feature } from "./types";
import { points, polygon } from "@turf/helpers";
import pointsWithinPolygon from "@turf/points-within-polygon";
import { Dispatch, RefObject, SetStateAction } from "react";
import * as d3 from 'd3';
import { FlyToInterpolator, MapViewState } from "deck.gl";

const splitAtAntimeridian = (coords: number[][]) => {
  let crossesAntimeridian = false;
  coords.every((d, i) => {
    crossesAntimeridian = Math.abs(d[0] - coords[(i + 1) % coords.length][0]) > 180 ? true : false;
    if (crossesAntimeridian) return false;
    return true;
  })

  if (!crossesAntimeridian) return [coords];
  else return []
  // skipping anti meridian polygons
  // TODO: Need to work on proper splitting process

  // // Normalize longitudes to [-180, 180] for splitting
  // const normalized = coords.map(([lon, lat]) => [lon > 180 ? lon - 360 : lon, lat]);
  // // Split the polygon by traversing the path
  // const left = [], right = [];
  // // Use the longitude of the first point to decide the starting polygon
  // const firstLon = normalized[0][0]; // lon is first in [lon, lat]
  // let currentPoly = firstLon < 0 ? left : right;
  // for (let i = 0; i < normalized.length; i++) {
  //   const [lon1, lat1] = normalized[i];
  //   const [lon2, lat2] = normalized[(i + 1) % normalized.length];
  //   // Add the current point to the current polygon
  //   currentPoly.push([lon1, lat1]);
  //   // Check if the segment crosses the antimeridian
  //   if (Math.abs(lon1 - lon2) > 180) {
  //     // Calculate the intersection point at the antimeridian
  //     const t = (180 - Math.abs(lon1)) / Math.abs(lon1 - lon2);
  //     const latCross = lat1 + t * (lat2 - lat1);
  //     // Add the intersection point to both polygons
  //     if (lon1 < 0) {
  //       left.push([-180, latCross]);
  //       right.push([180, latCross]);
  //       currentPoly = right; // Switch to the right polygon
  //     } else {
  //       right.push([180, latCross]);
  //       left.push([-180, latCross]);
  //       currentPoly = left; // Switch to the left polygon
  //     }
  //   }
  // }
  // // Filter out invalid polygons and convert back to [lat, lon]
  // return [left, right]
  //   .filter(poly => poly.length > 2)
  //   .map(poly => poly.map(([lon, lat]) => [lat, lon]));
}

export const getH3GeoJSON = (geoJSONfeatures: Feature[], res: number) => {
  const hexCountries = geoJSONfeatures.map(country => {
    const geometry = country.geometry;
    const name = country.properties.NAME;
    if (!geometry || !geometry.coordinates) {
      return { name, hexagons: [] };
    }

    let hexagons: string[] = [];

    try {
      if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygonCoords) => hexagons = hexagons.concat(h3.polyfill(polygonCoords, res, true)));
      } else hexagons = h3.polyfill(geometry.coordinates, res, true);
      return { name, hexagons: [...new Set(hexagons)] };
    } catch (error) {
      return { name, hexagons: [] };
    }
  });

  return {
    type: 'FeatureCollection',
    features: hexCountries.flatMap(country =>
      country.hexagons.flatMap(hex => {
        const boundaries = splitAtAntimeridian(h3.h3ToGeoBoundary(hex, true).reverse());
        return boundaries.map(boundary => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [boundary]
          },
          properties: { country: country.name }
        }));
      })
    )
  };

}

export const getA5GeoJSON = (geoJSONfeatures: Feature[], res: number) => {
  const centroids = getAllA5centroids(res);
  const a5Countries = geoJSONfeatures.map(country => {
    const geometry = country.geometry;
    const name = country.properties.NAME;
    if (!geometry || !geometry.coordinates) {
      return { name, pentagons: [] };
    }
    let pentagons: string[] = [];

    try {
      if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygonCoords) => {
          pentagons.push(a5PolygonToCell(centroids, polygonCoords));
        });
      } else {
        pentagons.push(a5PolygonToCell(centroids, geometry.coordinates));
      }
      return { name, pentagons: [...new Set(pentagons)] };
    } catch (error) {
      return { name, pentagons: [] };
    }
  });

  return {
    type: 'FeatureCollection',
    features: a5Countries.flatMap(country =>
      country?.pentagons?.flatMap(hex => {
        const boundaries = a5cellIdsToGeometries(hex);
        const reversedBoundaries = boundaries.map((d: number[][]) => [...d].reverse());
        // const splitReversedBoundaries = reversedBoundaries.flatMap(boundary =>
        //   splitAtAntimeridian(boundary)
        // );
        return reversedBoundaries.map(boundary => ({
          // return splitReversedBoundaries.map(boundary => ({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [boundary]
          },
          properties: { country: country.name }
        }));
      })
    )
  };

}

export const getAllA5centroids = (resolution: number) => {
  const cells = [];
  const cellIds = cellToChildren(0n, resolution + 2);

  for (let cellId of cellIds) {
    const cellIdHex = u64ToHex(cellId);
    const centroid = cellToLonLat(cellId);
    cells.push({ cellIdHex, 'centroid': centroid }
    );
  }
  return cells;
}

export type A5Centroid = {
  cellIdHex: string;
  centroid: number[];
}

export const a5PolygonToCell = (centroids: Array<A5Centroid>, polygonGeometry: Polygon): Array<string> => {
  const intersections = polygonGeometry.length > 0 ?
    centroids.map((d) => {
      const poly = polygon(polygonGeometry);
      const pnt = points([d.centroid])
      const result = pointsWithinPolygon(pnt, poly)

      return result?.features[0]?.geometry?.coordinates[0] ? d.cellIdHex : null;
    }) : [];
  return intersections.filter(item => item != null)
  // return ['5380000000000000'];
}

export const a5cellIdsToGeoJSON = (cellHexIds: string[]) => {
  const geoJSONfeatures: Feature[] = cellHexIds.map((d: string) => {
    const boundary = cellToBoundary(hexToU64(d));
    return {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [boundary] },
      properties: { 'cellIdHex': d }
    };
  });

  return { type: "FeatureCollection", features: geoJSONfeatures };
}

export const a5cellIdsToGeometries = (cellHexIds: string[]) => {
  const geometryArray: Geometry[] = cellHexIds.map((d: string) => cellToBoundary(hexToU64(d)));
  return geometryArray;
}

export const handleGlobeClick = (
  coords: [number, number] | never[],
  screenPos: [number, number],
  _svgRef: RefObject<SVGSVGElement | null>,
  setViewState: Dispatch<SetStateAction<MapViewState>>,
) => {

  // logic occurs inside of setViewState to ensure viewState is current 
  const mapPanel = d3.select("#DeckMap")
  const fLeft = 140, fTop = 0, fWidth = 540, fHeight = 500;

  setViewState(prev => {
    if (!prev.latitude) {
      const [startX, startY] = screenPos;
      mapPanel
        .style('position', 'absolute')
        .style('transform', 'scale(0.1)')
        .style('filter', 'blur(4px)')
        .style('left', `${startX - 160}px`)
        .style('top', `${startY - 240}px`)
        .style('width', `${fWidth}px`)
        .style('height', `${fHeight}px`)
        .style('opacity', 0.1)
        .transition()
        .duration(1400)
        .ease(d3.easePoly)
        .style('transform', 'scale(1.0)')
        .style('filter', 'blur(0px)')
        .style('left', `${fLeft}px`)
        .style('top', `${fTop}px`)
        .style('width', `${fWidth}px`)
        .style('height', `${fHeight}px`)
        .style('opacity', 0.5);
    } else {
      mapPanel
        .style('position', 'absolute')
        .style('transform', 'scale(0.9)')
        .style('filter', 'blur(4px)')
        .style('left', `${fLeft}px`)
        .style('top', `${fTop}px`)
        .style('width', `${fWidth}px`)
        .style('height', `${fHeight}px`)
        .style('opacity', 0.7)
        .transition()
        .duration(2000)
        .ease(d3.easeCircleOut)
        .style('transform', 'scale(1.0)')
        .style('filter', 'blur(0px)') // Start blurred
        .style('left', `${fLeft}px`)
        .style('top', `${fTop}px`)
        .style('width', `${fWidth}px`)
        .style('height', `${fHeight}px`)
        .style('opacity', 0.9);
    }
    return ({
      ...prev,
      latitude: coords[1],
      longitude: coords[0],
      zoom: 7,
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator(),
    })
  });
};
