import * as d3 from 'd3';
import { geoOrthographic, geoPath } from 'd3-geo';
import { CountryFeatureProps, D3Elements, D3Selection, Dimensions, Feature, FeatureConfig, GlobeConfig, GlobeInteractionsConfig, GlobeState, Interactions, Polygon, SetupGraphics, } from "./types";
import { addSatNav } from "./satNavFuncs";

export const drawGlobe = ({
  width,
  height,
  svgRef,
  onGlobeClick,
  controlsState,
  geoJSONfeatures = []
}: Dimensions & GlobeConfig & { geoJSONfeatures: Feature[] }) => {
  const radius = Math.min(width, height) / 2.4;
  const svg = d3.select(svgRef.current)
    .attr('width', width)
    .attr('height', height);
  svg.selectAll('*').remove();
  const divergingVirdis = (lat: number) => d3.interpolateViridis(1 - (Math.abs(lat) / 56.25));
  const divergingMagma = (lat: number) => d3.interpolateMagma(1 - (Math.abs(lat) / 56.25));

  const { g, path, projection } = globeSetup({ width, height, radius, svg });

  const features: D3Selection = g.selectAll('.land')
    .data(geoJSONfeatures)
    .enter()
    .append('path')
    .attr('class', 'land')
    .attr('d', path)
    .attr('fill', function(d: any) {
      const fillColor = controlsState.color === 2
        ? divergingVirdis(d3.geoCentroid(d)[1])
        : controlsState.color === 3
          ? divergingMagma(d3.geoCentroid(d)[1])
          : '#1A1A1A';
      d3.select(this).attr('data-initial-fill', fillColor);
      return fillColor;
    })
    .attr('fill-opacity', '0.7')
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
  const { satellites, satProjection, satPath } = addSatNav(g, radius * 1.5, width, height, svgRef);

  globeInteractions({
    dimensions: { width, height, radius },
    d3Elements: { svg, svgRef, g },
    globeBase: { features, path, projection, graticules },
    adjacentFeatures: { features: satellites, path: satPath, projection: satProjection, rotationFactor: controlsState.satSpeed },
    interactions: { onGlobeClick, controlsState }
  });
};

export const rotationEvent = d3.dispatch('speedChange');

export const updateRotationSpeed = (newSpeed: number): void => { rotationEvent.call('speedChange', {}, newSpeed) }

let rotationLambda = 0;
let rotationPhi = 0;
let rotationTimer: d3.Timer | null = null;

export const globeInteractions = ({ dimensions, d3Elements, globeBase, adjacentFeatures, interactions }: GlobeInteractionsConfig
) => {
  globeBase.features.on('click', null);
  adjacentFeatures.features.on('click', null);

  // Rotation state
  let lambda = 0, phi = 0; // timer: d3.Timer | null = null;
  const updateRotation = (newSpeed: number) => {
    if (rotationTimer) rotationTimer.stop();
    rotationLambda = 0;  // Reset rotation
    rotationPhi = 0;
    rotationTimer = d3.timer(() => {
      // console.log('in time, update rotation', adjacentFeatures.rotationFactor)
      console.log('in timer, update rotation', interactions.controlsState.satSpeed)
      rotationLambda += newSpeed;
      // globeBase.projection.rotate([rotationLambda, rotationPhi]);
      adjacentFeatures.projection.rotate([rotationLambda * (interactions.controlsState.satSpeed), rotationPhi]);
      globeBase.features.attr('d', globeBase.path);
      adjacentFeatures.features.attr('d', adjacentFeatures.path);
      // globeBase.graticules.attr('d', globeBase.path);
      // d3Elements.g.selectAll('.satellites').attr('d', adjacentFeatures.path)
      // d3Elements.g.select('circle').attr('d', globeBase.path);
    });
  };

  // rotationEvent.on('speedChange', null);
  rotationEvent.on('speedChange', (newSpeed: number) => updateRotation(newSpeed));
  updateRotation(interactions.controlsState.rotation); //init rotation

  // Drag Zoom
  const drag = d3.drag<SVGSVGElement, unknown>()
    .on('drag', (event) => {
      const sensitivity = 0.25;
      rotationLambda += event.dx * sensitivity;
      rotationPhi -= event.dy * sensitivity;
      globeBase.projection.rotate([lambda, phi]);
      globeBase.features.attr('d', globeBase.path);
      d3Elements.g.select('circle').attr('d', globeBase.path);
    });
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([dimensions.radius - 20, dimensions.radius * 3]) // Min/max zoom levels
    .on('zoom', (event) => {
      globeBase.projection.scale(event.transform.k);
      globeBase.features.attr('d', globeBase.path);
      d3Elements.g.select('circle').attr('r', event.transform.k);
      d3Elements.g.select('.gradient-circle').attr('r', (dimensions.radius / 1.028) * (event.transform.k / (dimensions.radius - 10)));
    });
  // Capture Click for map interaction
  d3Elements.svg.on('click', (event) => {
    const [x, y] = d3.pointer(event, d3Elements.svg.node());
    const coords = 'invert' in globeBase.projection ? globeBase.projection.invert!([x - dimensions.width / 2, y - dimensions.height / 2]) : [];
    if (coords) interactions.onGlobeClick(coords, [x, y], d3Elements.svgRef);
  });

  // Apply drag and zoom to SVG
  d3Elements.svg.call(drag).call(zoom);
  // Initial zoom reset
  d3Elements.svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(dimensions.radius - 10));
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
        .style('filter', 'none')
        .style('fill-opacity', 0.7)
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

export const globeSetup = ({ width, height, radius, svg }:
  Dimensions & { svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined> }
): GlobeState => {
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

  globeGradient({ radius, svg: g });

  return { g, path, projection };
}

export const globeGradient = ({ radius, svg }: SetupGraphics) => {
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
