/////////////////////////
// COMPONENT TYPES //
/////////////////////////

import { ReactNode, RefObject } from "react";

export interface PanelProps {
  items: ControlItem[];
  renderItems: (item: ControlItem, index: number) => ReactNode;
};

export interface ControlProps {
  rotation: number,
  land: number,
  res: number,
  color: number,
  satSpeed: number
};

export type ControlItem = [string, number, number, number, number, string[] | number[], (e: React.ChangeEvent<HTMLInputElement>) => void];

export interface D3PanelProps {
  onGlobeClick: (coords: [number, number] | never[],
    screenPos: [number, number],
    svgRef: RefObject<SVGSVGElement | null>,
  ) => void,
  controlsState: ControlProps,
};


