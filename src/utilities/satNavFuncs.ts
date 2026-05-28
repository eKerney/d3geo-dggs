import * as d3 from 'd3';
import { geoOrthographic, geoPath } from 'd3-geo';
import { D3Selection, Feature } from "./types";
import { dataInteractions } from './globeFuncs';
import { RefObject } from 'react';

export const addSatNav = (
  g: SVGGElement | unknown | null | undefined,
  radius: number,
  width: number,
  height: number,
  svgRef: RefObject<SVGSVGElement | null>,
) => {
  const svg = d3.select(svgRef.current)
    .attr('width', width)
    .attr('height', height);
  const projection = geoOrthographic()
    .scale(radius)
    .translate([0, 0])
    .rotate([0, 0])
    .clipAngle(80);

  const path = geoPath().pointRadius(8).projection(projection);

  const satNav = {
    type: 'FeatureCollection',
    features: [
      {
        type: "Feature",
        properties: { id: '001', inclination: 45, period: 90, phase: 0 },
        geometry: { coordinates: [-70, 10], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '002', inclination: 45, period: 90, phase: 0 },
        geometry: { coordinates: [70, 0], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '003', inclination: 60, period: 90, phase: 0 },
        geometry: { coordinates: [-30, 10], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '003', inclination: 60, period: 90, phase: 0 },
        geometry: { coordinates: [30, 0], type: "Point" }
      },
    ]
  }

  const satellites: D3Selection = g.selectAll('.satellites')
    .data(satNav.features)
    .enter()
    .append('path')
    .attr('class', 'satellites')
    .attr('d', path)
    .attr('fill', '#bdbdbd')
    .attr('fill-opacity', '0.7')
    .attr('stroke', 'white')
    .attr('stroke-width', '2px')
    .attr('stroke-opacity', '0.8')
    .attr('height', 10000)

  dataInteractions(satellites, svg);
  return { satellites: satellites, satProjection: projection, satPath: path };
}

export const updateSatellitePosition = (satellite: Feature, time: number): Feature => {
  const { inclination, period, phase } = satellite.properties;

  // Calculate current orbital angle
  const angle = ((time / Number(period)) * 360 + Number(phase)) % 360;
  const radians = angle * (Math.PI / 180);

  // Calculate new coordinates using orbital mechanics
  const lat = Math.asin(Math.sin(radians) * Math.sin(Number(inclination) * Math.PI / 180)) * (180 / Math.PI);
  const lon = Math.atan2(
    Math.cos(radians) * Math.cos(Number(inclination) * Math.PI / 180),
    Math.sin(radians)
  ) * (180 / Math.PI);

  // Update the GeoJSON geometry directly
  satellite.geometry.coordinates = [lon, lat];

  return satellite;
};
