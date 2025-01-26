export function computePointsAverage(points: StaticArray<f64>): StaticArray<f64> {
  let sumX: f64 = 0;
  let sumY: f64 = 0;
  let count: i32 = points.length / 2; // number of points

  if (count === 0) return StaticArray.fromArray([0.0, 0.0]);

  // Even indices (0,2,4...) are X coordinates
  // Odd indices (1,3,5...) are Y coordinates
  for (let i = 0; i < points.length; i += 2) {
    sumX += points[i];     // X coordinate
    sumY += points[i + 1]; // Y coordinate
  }

  return StaticArray.fromArray([
    sumX / f64(count),
    sumY / f64(count)
  ]);
}
