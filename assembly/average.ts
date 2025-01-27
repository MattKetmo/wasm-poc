@unmanaged
class Point {
  constructor(
    public x: f64 = 0,    // 8 bytes
    public y: f64 = 0,    // 8 bytes
    public z: i32 = 0,    // 4 bytes
  ) {}
}

export function setPoint(points: StaticArray<Point>, index: i32, x: f64, y: f64, z: i32): void {
  points[index] = new Point(x, y, z);
}

export function getPoint(points: StaticArray<Point>, index: i32): Point {
  return points[index];
}

export function computePointsAverage(points: StaticArray<Point>, len: i32): StaticArray<f64> {
  let sumX: f64 = 0;
  let sumY: f64 = 0;
  let sumZ: f64 = 0;

  for (let i = 0; i < len; i++) {
    const point = points[i];
    sumX += point.x;
    sumY += point.y;
    sumZ += f64(point.z); // Convert i32 to f64 for averaging
  }

  return StaticArray.fromArray([
    sumX / f64(len),
    sumY / f64(len),
    sumZ / f64(len)
  ]);
}
