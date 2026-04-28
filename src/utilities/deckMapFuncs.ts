import { RefObject } from "react";
import * as d3 from 'd3';

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

