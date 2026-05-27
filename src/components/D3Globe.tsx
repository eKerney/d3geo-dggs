import { useEffect, useRef } from 'react';
import useWindowSize from '../hooks/useWindowSize';
import { useFetchData } from '../hooks/useFetchData';
import { drawGlobe } from '../utilities/globeFuncs';
import { getA5GeoJSON, getA5GeoJSONupdated, getH3GeoJSON } from '../utilities/utilFuncs';
import { D3PanelProps } from './types';
import * as d3 from 'd3';


export const D3Globe = ({ onGlobeClick, controlsState }: D3PanelProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { width, height } = useWindowSize();

  const url = 'https://raw.githubusercontent.com/eKerney/vite-map-deck/refs/heads/main/src/data/countries_filtered.geojson';
  const { data } = useFetchData(url);

  useEffect(() => {
    if (!svgRef.current) return;
    const geoJSONfeatures = controlsState.land === 1
      ? (data ? data.features : [])
      : controlsState.land === 2
        ? getH3GeoJSON(data ? data.features : [], controlsState.res).features
        // : getA5GeoJSON(data ? data.features : [], controlsState.res).features;
        : getA5GeoJSONupdated(data ? data.features : [], controlsState.res).features;

    data && drawGlobe({ width, height, svgRef, onGlobeClick, controlsState, geoJSONfeatures })

    // cleanup func
    return () => {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        svg.on('click', null);
      }
    }
  }, [width, height, data, controlsState.land, controlsState.res, controlsState.color, controlsState.satSpeed]);

  return (
    <div >
      <svg ref={svgRef} className="mt-2"></svg>
    </div>
  );
};

export default D3Globe;
