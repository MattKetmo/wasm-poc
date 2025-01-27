// Memory layout must be explicit and packed
@unmanaged
export class Point {
  constructor(
    public x: f64 = 0,
    public y: f64 = 0,
  ) {}
}

// Helper function to read a Point from memory
export function getPoint(points: StaticArray<Point>, index: i32): Point {
  return points[index];
}

// Helper function to set a Point in memory
export function setPoint(points: StaticArray<Point>, index: i32, x: f64, y: f64): void {
  points[index] = new Point(x, y);
}

// Main computation function
export function computePointsAverage(points: StaticArray<Point>, len: i32): StaticArray<f64> {
  let sumX: f64 = 0;
  let sumY: f64 = 0;

  for (let i = 0; i < len; i++) {
    const point = points[i];
    sumX += point.x;
    sumY += point.y;
  }

  return StaticArray.fromArray([
    sumX / f64(len),
    sumY / f64(len)
  ]);
}
