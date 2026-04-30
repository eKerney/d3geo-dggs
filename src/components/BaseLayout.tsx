import { MapViewState } from "deck.gl";
import { D3Globe, Controls } from "../components"
import { RefObject, useEffect, useState } from "react";
import { updateRotationSpeed } from "../utilities/globeFuncs";
import { ControlItem, ControlProps } from "./types";
import { handleGlobeClick } from "../utilities/utilFuncs";

export const BaseLayout = () => {
  const [_viewState, setViewState] = useState<MapViewState>({ longitude: 0, latitude: 0, zoom: 2, pitch: 0, bearing: 0 });
  const [controlsState, setControlsState] = useState<ControlProps>({ rotation: .05, land: 1, res: 1, color: 1, satSpeed: 2 });

  useEffect(() => {
    updateRotationSpeed(controlsState.rotation);
  }, [controlsState.rotation]);

  const controls: ControlItem[] = [[
    '', .05, .25, .05, controlsState.rotation, ['slow', '', '', '', 'fast'],
    (e: React.ChangeEvent<HTMLInputElement>) => setControlsState({ ...controlsState, rotation: parseFloat(e.target.value) })],
  [
    '', 1, 3, 1, controlsState.land, ['Land', 'H3', 'A5'],
    (e: React.ChangeEvent<HTMLInputElement>) => setControlsState({ ...controlsState, land: parseInt(e.target.value) })],
  [
    '', 1, 3, 1, controlsState.res, ['low', 'med', 'high'],
    (e: React.ChangeEvent<HTMLInputElement>) => setControlsState({ ...controlsState, res: parseInt(e.target.value) })],
  [
    '', 1, 3, 1, controlsState.color, ['grey', 'vir', 'mag'],
    (e: React.ChangeEvent<HTMLInputElement>) => setControlsState({ ...controlsState, color: parseInt(e.target.value) })],
  ];

  const satControls: ControlItem[] = [
    [
      '', 2, 6, 2, controlsState.satSpeed, ['x2', 'Orb x4', 'x6'],
      (e: React.ChangeEvent<HTMLInputElement>) => setControlsState({ ...controlsState, satSpeed: parseInt(e.target.value) })],
  ];

  useEffect(() => console.log('based', controlsState), [controlsState])

  const globeClickCallback = (
    coords: [number, number] | never[],
    screenPos: [number, number],
    svgRef: RefObject<SVGSVGElement | null>,
  ) => handleGlobeClick(coords, screenPos, svgRef, setViewState);
  return (
    <>
      <div className="grid grid-cols-12 grid-rows-6  gap-0 h-screen overflow-visible bg-elevation-0   ">

        <div className="w-screen col-span-12 justify-center items-center " >

          <D3Globe onGlobeClick={globeClickCallback} controlsState={controlsState} />
        </div>

        <div className="fixed top-4 right-0 w-80 p-4  z-50">

          <Controls
            items={controls}
            renderItems={(d, i) => (
              <div key={`${d[0]}-${i}`} className="w-full max-w-xl ">
                <label className="label"><span className="label-text">{d[0]}</span></label>
                <input
                  type="range"
                  min={d[1]}
                  max={d[2]}
                  className="range range-sm range-accent w-full"
                  step={d[3]}
                  onChange={d[6]}
                  value={d[4]}
                />
                <div className="flex justify-between px-2.5 mt-2 text-xs">
                  {d[5].map((e: string | number, i) => <span key={`${e}-${i}`}>{e}</span>)}
                </div>
                <hr aria-hidden="true" style={{ visibility: 'hidden', margin: '.3rem 0' }} />
              </div>
            )}
          />
          <br />
          <br />
          <Controls
            items={satControls}
            renderItems={(d, i) => (
              <div key={`${d[0]}-${i}`} className="w-full max-w-xl ">
                <label className="label"><span className="label-text">{d[0]}</span></label>
                <input
                  type="range"
                  min={d[1]}
                  max={d[2]}
                  className="range range-sm range-accent w-full"
                  step={d[3]}
                  onChange={d[6]}
                  value={d[4]}
                />
                <div className="flex justify-between px-2.5 mt-2 text-xs">
                  {d[5].map((e: string | number, i) => <span key={`${e}-${i}`}>{e}</span>)}
                </div>
                <hr aria-hidden="true" style={{ visibility: 'hidden', margin: '.3rem 0' }} />
              </div>
            )}
          />
        </div>

        {/*<div className={mapContStyle} id='DeckMap'>
          {<DeckMap view_state={viewState} layers={[]} />}
        </div>*/}

      </div >
    </>
  );
}

export default BaseLayout

