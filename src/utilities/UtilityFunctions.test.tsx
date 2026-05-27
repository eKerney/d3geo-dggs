import { describe, expect, it } from "vitest";
import { a5cellIdsToGeoJSON, a5cellIdsToGeometries, a5PolygonToCell, getA5GeoJSON, getAllA5centroids } from "./utilFuncs";
import h3SinglePolyMorocco from '../data/H3moroccoHexFeature.json';
import { Polygon } from "./types";
import { polygonToCells } from "a5-js";

// describe('test getAllA5centroids', function() {
//   it('returns valid cellIdHex, centroid at Res0 ', async () => {
//     const input = 0
//     const result = getAllA5centroids(input);
//
//     expect(result).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining({
//           cellIdHex: '200000000000000',
//           centroid: [-93, 90]
//         })
//       ])
//     )
//   });
//
//   it('returns valid cellIdHex, centroid at Res1', async () => {
//     const input = 1
//     const result = getAllA5centroids(input);
//
//     expect(result).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining({
//           cellIdHex: "500000000000000",
//           centroid: [-236.99999999999997, 69.09240188013534]
//         })
//       ])
//     )
//   })
// });
//
// describe('test a5PolygonToCell', function() {
//   it('return the correct cellIdHex array Res0', async () => {
//     const centroids = [{ cellIdHex: '5380000000000000', centroid: [-10.838189842367342, 33.3067237705403] },
//     { cellIdHex: '5380028370000000', centroid: [-100.838189842367342, 75.3067237705403] }];
//     const result = a5PolygonToCell(centroids, h3SinglePolyMorocco.geometry as Polygon);
//     expect(result).toEqual(
//       expect.arrayContaining(['5380000000000000'])
//     )
//   });
// });
//
// describe('test a5cellIdsToGeoJSON', function() {
//   it('returns a GeoJSON Feature Collection with the correct polygons', async () => {
//     const centroids = ['5380000000000000'];
//     const result = a5cellIdsToGeoJSON(centroids);
//     expect(result.features).toEqual(
//       expect.arrayContaining([
//         expect.objectContaining({
//           "geometry": {
//             "coordinates": [
//               [
//                 [
//                   -139.52242598238394,
//                   55.8635309838565,
//                 ],
//                 [
//                   -139.52238797387025,
//                   55.86361405638346,
//                 ],
//                 [
//                   -139.52252621502458,
//                   55.863601018331615,
//                 ],
//                 [
//                   -139.52260731488064,
//                   55.863527459712444,
//                 ],
//                 [
//                   -139.5225257989194,
//                   55.86346590272602,
//                 ],
//                 [
//                   -139.52242598238394,
//                   55.8635309838565,
//                 ],
//               ],
//             ],
//             "type": "Polygon",
//           },
//           "properties": {
//             "cellIdHex": "5380000000000000",
//           },
//           "type": "Feature",
//         })
//       ])
//     )
//   });
// });
//
// describe('test a5cellIdsToGeometries', function() {
//   it('returns a', async () => {
//     const centroids = ['5380000000000000'];
//     const result = a5cellIdsToGeometries(centroids);
//     expect(result).toEqual(
//       expect.arrayContaining([
//         [
//           [
//             -139.52242598238394,
//             55.8635309838565,
//           ],
//           [
//             -139.52238797387025,
//             55.86361405638346,
//           ],
//           [
//             -139.52252621502458,
//             55.863601018331615,
//           ],
//           [
//             -139.52260731488064,
//             55.863527459712444,
//           ],
//           [
//             -139.5225257989194,
//             55.86346590272602,
//           ],
//           [
//             -139.52242598238394,
//             55.8635309838565,
//           ],
//         ],
//       ])
//     )
//   });
// });

// describe('test getA5GeoJSON', function() {
//   it('returns a', async () => {
//     const res = 1;
//     const result = getA5GeoJSON([h3SinglePolyMorocco], res);
//     console.log('result', result)
//   });
// });


describe('test new A5geo polygonToCells function', function() {
  it('returns a', async () => {
    const res = 4;
    const coords = [
      [-10.744488220052984, 36.383229951792835],
      [-5.442348460730093, 35.12442405176797],
      [-4.341769247156946, 30.69897412778907],
      [-8.002013895306685, 27.50290866718829],
      [-12.948554583750909, 28.514935780874872],
      [-14.570452111245078, 32.95438593767853],
      [-10.744488220052984, 36.383229951792835]
    ];
    const expected = [
      6001046503471185920n,
      6010053702725926912n,
      6019060901980667904n,
      6023564501608038400n,
      6037075300490149888n
    ]
    // const result = getA5GeoJSON([h3SinglePolyMorocco], res);
    // console.log('coords', h3SinglePolyMorocco.geometry.coordinates[0]);
    const result = polygonToCells(coords, res)
    expect(result).toEqual(expect.arrayContaining(expected));
    // console.log('result', cells)

  });
});


