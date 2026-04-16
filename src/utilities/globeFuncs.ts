import { Dispatch, RefObject, SetStateAction } from "react";
import * as d3 from 'd3';
import { geoOrthographic, geoPath } from 'd3-geo';
import { FlyToInterpolator, MapViewState } from "deck.gl";
import { D3Features, Feature, GlobeContexts, GlobeState, Polygon, SetupGraphics, WidthHeight } from "./types";
import { interpolateViridis } from "d3";


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

export const drawLines = (
  screenPos: [number, number],
  dim: { w: number, h: number, l: number, t: number },
  svgRef: RefObject<SVGSVGElement | null>,
) => {

  const svg = d3.select(svgRef.current)
  svg.selectAll(".connecting-line").remove();

  const [globeX, globeY] = screenPos;
  const cor = 96;
  const deckCorners = [
    [dim.l - cor + 4, dim.t + cor / 3], // Top-left
    [dim.l + dim.w - cor, dim.t + cor / 3], // Top-right
    [dim.l - cor + 4, dim.t + dim.h + cor / 4], // Bottom-left
    [dim.l + dim.w - cor, dim.t + dim.h - cor / 2] // Bottom-right
  ];

  deckCorners.forEach(([deckX, deckY], i) => {
    const path = svg.append("path")
      .attr("class", "connecting-line")
      .attr("d", `M${globeX},${globeY} Q${(globeX + deckX) / 2},${(globeY + deckY) / 2 - 50} ${deckX},${deckY}`)
      .attr("stroke", "rgba(255, 255, 255, 0.4)")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0px 0px 4px rgba(255,255,255,0.5))")
      .attr("fill", "none")
      .style('opacity', 0.3);

    const totalLength = path?.node()?.getTotalLength() ?? '';
    path
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1600)
      .delay(i * 100)
      .ease(d3.easeQuadOut)
      .attr("stroke-dashoffset", 0)
  });
};

export const drawGlobe = ({ width, height, svgRef, onGlobeClick, controlsState, data = { features: [] }, hexGeoJSON = { features: [] }, a5GeoJSON }:
  WidthHeight & GlobeContexts & any) => {
  const radius = Math.min(width, height) / 2.4;
  const svg = d3.select(svgRef.current)
    .attr('width', width)
    .attr('height', height);
  svg.selectAll('*').remove();
  const divergingVirdis = (lat: number) => interpolateViridis(1 - (Math.abs(lat) / 56.25));
  const divergingMagma = (lat: number) => d3.interpolateInferno(1 - (Math.abs(lat) / 56.25));

  const { g, path, projection } = globeSetup({ width, height, radius, svg });

  const features: Feature = g.selectAll('.land')
    .data(controlsState.land === 2
      ? hexGeoJSON.features
      : controlsState.land === 3
        ? a5GeoJSON.features
        : data.features)
    .enter()
    .append('path')
    .attr('class', 'land')
    .attr('d', path)
    .attr('fill', function(d) {
      const fillColor = controlsState.color === 2
        ? divergingVirdis(d3.geoCentroid(d)[1])
        : controlsState.color === 3
          ? divergingMagma(d3.geoCentroid(d)[1])
          : '#1A1A1A';
      d3.select(this).attr('data-initial-fill', fillColor);
      return fillColor;
    })
    .attr('fill-opacity', '0.8')
    .attr('stroke', 'white')
    .attr('stroke-width', '.5px')
    .attr('stroke-opacity', '0.2')
    .each(function() { d3.select(this).datum().isHovered = true });

  const graticules = g.append('path')
    .datum(d3.geoGraticule10())
    .attr("d", path)
    .attr("stroke", "rgba(255, 255, 255, 0.08)")
    .attr('stroke-width', '0.3px')
    .attr('fill', 'none')

  dataInteractions(features, svg);
  globeInteractions({ width, height, svgRef, onGlobeClick, controlsState, radius, svg, g, projection, path, features, graticules })

};

export const rotationEvent = d3.dispatch('speedChange');

export const updateRotationSpeed = (newSpeed: number): void => {
  rotationEvent.call('speedChange', {}, newSpeed);
}

let rotationLambda = 0;
let rotationPhi = 0;
let rotationTimer: d3.Timer | null = null;

export const globeInteractions = ({ width, height, svgRef, onGlobeClick, controlsState, radius, svg, g, projection, path, features, graticules }:
  WidthHeight & GlobeContexts & SetupGraphics & GlobeState & D3Features) => {
  // features.data([]).exit().remove(); // Clear data and remove unbound elements
  features.on('click', null);

  // Rotation state
  let lambda = 0, phi = 0, timer: d3.Timer | null = null;
  const updateRotation = (newSpeed: number) => {
    if (rotationTimer) rotationTimer.stop();  // Stop OLD timer
    rotationLambda = 0;  // Reset rotation
    rotationPhi = 0;
    rotationTimer = d3.timer(() => {
      rotationLambda += newSpeed;
      projection.rotate([rotationLambda, rotationPhi]);
      features.attr('d', path);
      graticules.attr('d', path);
      g.select('circle').attr('d', path);
    });
  };

  rotationEvent.on('speedChange', null);
  rotationEvent.on('speedChange', (newSpeed: number) => updateRotation(newSpeed));
  updateRotation(controlsState.rotation); //init rotation

  // Drag Zoom
  const drag = d3.drag<SVGSVGElement, unknown>()
    .on('drag', (event) => {
      const sensitivity = 0.25;
      rotationLambda += event.dx * sensitivity;
      rotationPhi -= event.dy * sensitivity;
      projection.rotate([lambda, phi]);
      features.attr('d', path);
      g.select('circle').attr('d', path);
    });
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([radius - 20, radius * 3]) // Min/max zoom levels
    .on('zoom', (event) => {
      projection.scale(event.transform.k);
      features.attr('d', path);
      g.select('circle').attr('r', event.transform.k);
      g.select('.gradient-circle').attr('r', (radius / 1.028) * (event.transform.k / (radius - 10)));
    });
  // Capture Click for map interaction
  svg.on('click', (event) => {
    const [x, y] = d3.pointer(event, svg.node());
    const coords = 'invert' in projection ? projection.invert!([x - width / 2, y - height / 2]) : [];
    if (coords) onGlobeClick(coords, [x, y], svgRef);
  });

  // Apply drag and zoom to SVG
  svg.call(drag).call(zoom);
  // Initial zoom reset
  svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(radius - 10));
}

export type CountryFeatureProps = {
  country?: string;
  NAME: string;
}

export const dataInteractions = (
  features: d3.Selection<SVGPathElement, Feature<Polygon, CountryFeatureProps>, SVGGElement, unknown>,
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
) => {
  features.on('click', null);
  const hoverState = new WeakMap<SVGPathElement, boolean>();

  features
    .on('mouseenter', function(event, d) {
      const element = this as SVGPathElement;
      let isHovered = hoverState.get(element) || false;

      if (!isHovered) {
        isHovered = true;
        d3.select(this)
          // .raise() 
          .interrupt()
          .style('transform', 'scale(1.3)')
          .style('transform-origin', 'center')
          .style('transform-box', 'fill-box')
          .style('filter', 'url(#white-glow)')
          .style('fill-opacity', 0.5)
          .style('stroke-opacity', 0.8)
          .attr('fill', '#ffffff')
        svg.select('.tooltip').remove();
        svg.append('text')
          .attr('class', 'tooltip')
          .attr('x', event.offsetX + 20)
          .attr('y', event.offsetY - 20)
          .attr('fill', '#fff')
          .attr('font-size', '18px')
          .attr('pointer-events', 'none')
          .text(d.properties.country || d.properties.NAME);
      }
    })
    .on('mousemove', function(event) {
      svg.select('.tooltip')
        .attr('x', event.offsetX + 20)
        .attr('y', event.offsetY - 20);
    })
    .on('mouseleave', function(_event, _d: Feature) {
      const element = this as SVGPathElement;
      hoverState.set(element, false);
      d3.select(this)
        // .interrupt()
        .style('filter', 'none')
        .style('fill-opacity', 0.8)
        .attr('fill', function() {
          return d3.select(this).attr('data-initial-fill') || '#1A1A1A';
        })
        .transition()
        .duration(600)
        .style('stroke-opacity', 0.2)
        .style('transform', 'scale(1)')
        .style('transform-origin', 'center')
        .style('transform-box', 'fill-box')
      svg.select('.tooltip').remove();
    });
}

export const globeSetup = ({ width, height, radius, svg }: WidthHeight & SetupGraphics): GlobeState => {
  // Clear previous content
  svg.selectAll('*').remove();
  // Center the globe
  const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);

  // Orthographic projection
  const projection = geoOrthographic()
    .scale(radius)
    .translate([0, 0])
    .rotate([0, 0])
    .clipAngle(80);
  const path = geoPath().projection(projection);

  const glow = svg.append("defs").append("filter")
    .attr("id", "white-glow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");
  glow.append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("stdDeviation", 4)
    .attr("flood-color", "white")
    .attr("flood-opacity", 0.9);

  // Globe background (ocean)
  g.append('circle')
    .datum({ type: "Sphere" })
    .attr('r', radius)
    .attr('fill', '#333338')
    .attr('fill-opacity', '0.3')

  globeGradient({ width, height, radius, svg: g });

  return { g, path, projection };
}

export const globeGradient = ({ _width, _height, radius, svg }: WidthHeight & SetupGraphics) => {
  const gradient = svg.append("defs").append("radialGradient")
    .attr("id", "gradient")
    .attr("cx", "75%")
    .attr("cy", "25%")

  gradient.append("stop")
    .attr("offset", "5%")
    .attr("stop-color", "#fffff0");

  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#333338");

  const fill = svg.append("circle")
    .attr("class", "gradient-circle")
    .attr("r", radius / 1.028)
    .style("fill", "url(#gradient)")
    .attr('fill-opacity', '0.18')
    .attr('stroke', 'none')
}
