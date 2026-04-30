import * as d3 from 'd3';
import { geoOrthographic, geoPath } from 'd3-geo';
import { D3Selection } from "./types";
import { dataInteractions } from './globeFuncs';
import { RefObject } from 'react';

export const addSatNav = (
  g: SVGGElement | unknown | null | undefined,
  radius: number,
  width: number,
  height: number,
  svgRef: RefObject<SVGSVGElement | null>,
) => {
  console.log('in satnav')
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
        properties: { id: '001' },
        geometry: { coordinates: [-70, 10], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '002' },
        geometry: { coordinates: [70, 0], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '001' },
        geometry: { coordinates: [-30, 10], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '002' },
        geometry: { coordinates: [30, 0], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '001' },
        geometry: { coordinates: [-100, 10], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '002' },
        geometry: { coordinates: [100, 0], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '001' },
        geometry: { coordinates: [-120, 0], type: "Point" }
      },
      {
        type: "Feature",
        properties: { id: '002' },
        geometry: { coordinates: [120, 0], type: "Point" }
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

