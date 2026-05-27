import { describe, expect, it } from "vitest";
import { a5cellIdsToGeoJSON, a5cellIdsToGeometries, a5PolygonToCell, getA5GeoJSON, getAllA5centroids } from "./utilFuncs";
import h3SinglePolyMorocco from '../data/H3moroccoHexFeature.json';
import { Polygon } from "./types";
import { polygonToCells, cellToBoundary, u64ToHex } from "a5-js";

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
describe('test a5cellIdsToGeoJSON old method', function() {
  it('returns a GeoJSON Feature Collection with the correct polygons', async () => {
    // const centroids = ['5380000000000000'];
    // const result = a5cellIdsToGeoJSON(centroids);
    //
    const centIntInd = new BigUint64Array([6001046503471185920n]);
    const centroids = u64ToHex(centIntInd[0]);
    const result = a5cellIdsToGeoJSON([centroids]);

    // console.log('a5 geojson geometry', result.features[0].geometry?.coordinates)
    expect(result.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "geometry": {
            "coordinates": [
              [
                [-5.845777412874895, 33.34880484292087],
                [-6.602511865843439, 33.11389028852749],
                [-7.354707843543338, 32.87465744163976],
                [-8.10238832653863, 32.63116980799562],
                [-8.845579709036201, 32.38348979655655],
                [-8.312049147593939, 31.898235559525475],
                [-7.790719710755866, 31.408763720093635],
                [-7.280891519152647, 30.915700802427306],
                [-6.78189831072018, 30.419584867888304],
                [-5.997509268266981, 30.43781688347468],
                [-5.212619792189798, 30.45158429782709],
                [-4.427232339355896, 30.460888146688568],
                [-3.641355699946075, 30.465727352728194],
                [-3.3881156926380527, 31.080045608748378],
                [-3.134917235551711, 31.692774203106165],
                [-2.8814023907757473, 32.30385256844998],
                [-2.6272287171696007, 32.913233804472554],
                [-3.4274408815372226, 33.029515683188805],
                [-4.23050170435431, 33.140963220209336],
                [-5.0365567915848715, 33.24744498903347],
                [-5.845777412874895, 33.34880484292087]
              ]
            ],
            "type": "Polygon",
          },
          "properties": {
            "cellIdHex": "5348000000000000",
          },
          "type": "Feature",
        })
      ])
    )
  });
});
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


describe('test A5geo polygonToCells with simple hexagon', function() {
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
    const expected = new BigInt64Array([
      6001046503471185920n,
      6010053702725926912n,
      6019060901980667904n,
      6023564501608038400n,
      6037075300490149888n
    ]);
    const result = polygonToCells(coords, res)
    expect([...result]).toEqual([...expected]);

  });
});


describe('A5geo cellToBoundary ', function() {
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
    const cells = new BigInt64Array([
      6001046503471185920n,
      6010053702725926912n,
      6019060901980667904n,
      6023564501608038400n,
      6037075300490149888n
    ]);
    const expected = [
      [-5.845777412874895, 33.34880484292087],
      [-6.602511865843439, 33.11389028852749],
      [-7.354707843543338, 32.87465744163976],
      [-8.10238832653863, 32.63116980799562],
      [-8.845579709036201, 32.38348979655655],
      [-8.312049147593939, 31.898235559525475],
      [-7.790719710755866, 31.408763720093635],
      [-7.280891519152647, 30.915700802427306],
      [-6.78189831072018, 30.419584867888304],
      [-5.997509268266981, 30.43781688347468],
      [-5.212619792189798, 30.45158429782709],
      [-4.427232339355896, 30.460888146688568],
      [-3.641355699946075, 30.465727352728194],
      [-3.3881156926380527, 31.080045608748378],
      [-3.134917235551711, 31.692774203106165],
      [-2.8814023907757473, 32.30385256844998],
      [-2.6272287171696007, 32.913233804472554],
      [-3.4274408815372226, 33.029515683188805],
      [-4.23050170435431, 33.140963220209336],
      [-5.0365567915848715, 33.24744498903347],
      [-5.845777412874895, 33.34880484292087]
    ];
    const result = cellToBoundary(cells[0]);
    // console.log(expected)
    expect(result).toEqual(expect.arrayContaining(expected));

  });
});

